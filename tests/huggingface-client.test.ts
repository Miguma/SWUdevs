import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkHuggingFaceHealth,
  executeHuggingFaceExtraction,
  HUGGING_FACE_MODEL,
} from "../src/server/services/huggingface-client";

const input = {
  title: "Team sync",
  rawText: "Maria: I will draft the poster tomorrow.",
  meetingDate: "2026-10-20",
  model: HUGGING_FACE_MODEL,
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
const catalog = (supportsStructuredOutput = true) => json({
  data: [{
    id: HUGGING_FACE_MODEL,
    providers: [{ provider: "deepinfra", status: "live", supports_structured_output: supportsStructuredOutput }],
  }],
});
const completion = json({
  model: HUGGING_FACE_MODEL,
  choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
    summary: "Poster assigned to Maria.",
    actionItems: [{
      title: "Draft the poster",
      description: null,
      assignees: ["Maria"],
      originalDeadlineText: "tomorrow",
      deadlineRelation: "by",
      commitmentStatus: "confirmed",
      priority: null,
      evidenceQuote: "Maria: I will draft the poster tomorrow.",
      missingInformation: [],
    }],
    decisions: [],
    openQuestions: [],
    nextMeetingText: null,
  }) } }],
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Pinned open-weight cloud inference", () => {
  it("requires a server token and never contacts the cloud when absent", async () => {
    vi.stubEnv("HF_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await checkHuggingFaceHealth()).modelAvailable).toBe(false);
    await expect(executeHuggingFaceExtraction(input)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses exactly Qwen3-32B on DeepInfra with structured output and original notes", async () => {
    vi.stubEnv("HF_TOKEN", "test-only-token");
    const fetchMock = vi.fn().mockResolvedValueOnce(catalog()).mockResolvedValueOnce(completion);
    vi.stubGlobal("fetch", fetchMock);
    const result = await executeHuggingFaceExtraction(input);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("https://router.huggingface.co/v1/chat/completions");
    const options = fetchMock.mock.calls[1][1] as RequestInit;
    const body = JSON.parse(options.body as string);
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-only-token" });
    expect(body.model).toBe("Qwen/Qwen3-32B:deepinfra");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[1].content).toContain(input.rawText);
    expect(result.rawTranscript).toBe(input.rawText);
    expect(result.analysis).toMatchObject({ provider: "huggingface", model: HUGGING_FACE_MODEL });
    expect(result.actionItems[0].evidence[0].quote).toBe(input.rawText);
  });

  it("does not fall back when the pinned provider lacks structured output", async () => {
    vi.stubEnv("HF_TOKEN", "test-only-token");
    const fetchMock = vi.fn().mockResolvedValue(catalog(false));
    vi.stubGlobal("fetch", fetchMock);
    await expect(executeHuggingFaceExtraction(input)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports a credit or billing requirement without trying another provider", async () => {
    vi.stubEnv("HF_TOKEN", "test-only-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(catalog())
      .mockResolvedValueOnce(json({ error: "Payment required" }, 402));
    vi.stubGlobal("fetch", fetchMock);
    await expect(executeHuggingFaceExtraction(input)).rejects.toMatchObject({
      status: 402,
      message: expect.stringContaining("credits or billing"),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a different model and an empty response", async () => {
    vi.stubEnv("HF_TOKEN", "test-only-token");
    await expect(executeHuggingFaceExtraction({ ...input, model: "other/model" })).rejects.toMatchObject({ status: 422 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(catalog())
      .mockResolvedValueOnce(json({ model: HUGGING_FACE_MODEL, choices: [{ message: { content: "" } }] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(executeHuggingFaceExtraction(input)).rejects.toMatchObject({ status: 502 });
  });
});
