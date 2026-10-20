import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkGroqHealth,
  executeGroqExtraction,
  GROQ_MODEL,
} from "../src/server/services/groq-client";

const input = {
  title: "Team sync",
  rawText: "Maria: I will draft the poster tomorrow.",
  meetingDate: "2026-10-20",
  model: GROQ_MODEL,
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
const catalog = (model = GROQ_MODEL) => json({ data: [{ id: model, active: true }] });
const completion = json({
  model: GROQ_MODEL,
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
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await checkGroqHealth()).modelAvailable).toBe(false);
    await expect(executeGroqExtraction(input)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses exactly the free-tier Qwen model on Groq with structured output and original notes", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-only-token");
    const fetchMock = vi.fn().mockResolvedValueOnce(catalog()).mockResolvedValueOnce(completion);
    vi.stubGlobal("fetch", fetchMock);
    const result = await executeGroqExtraction(input);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.groq.com/openai/v1/models");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.groq.com/openai/v1/chat/completions");
    const options = fetchMock.mock.calls[1][1] as RequestInit;
    const body = JSON.parse(options.body as string);
    expect(options.headers).toMatchObject({ Authorization: "Bearer test-only-token" });
    expect(body.model).toBe(GROQ_MODEL);
    expect(body.reasoning_effort).toBe("none");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[1].content).toContain(input.rawText);
    expect(result.rawTranscript).toBe(input.rawText);
    expect(result.analysis).toMatchObject({ provider: "groq", model: GROQ_MODEL });
    expect(result.actionItems[0].evidence[0].quote).toBe(input.rawText);
  });

  it("does not fall back when the pinned model is unavailable", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-only-token");
    const fetchMock = vi.fn().mockResolvedValue(catalog("another/model"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(executeGroqExtraction(input)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports a free-tier rate limit without trying another provider", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-only-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(catalog())
      .mockResolvedValueOnce(json({ error: "Rate limit exceeded" }, 429));
    vi.stubGlobal("fetch", fetchMock);
    await expect(executeGroqExtraction(input)).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining("free-tier limit"),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a different model and an empty response", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-only-token");
    await expect(executeGroqExtraction({ ...input, model: "other/model" })).rejects.toMatchObject({ status: 422 });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(catalog())
      .mockResolvedValueOnce(json({ model: GROQ_MODEL, choices: [{ message: { content: "" } }] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(executeGroqExtraction(input)).rejects.toMatchObject({ status: 502 });
  });
  it("does not infer model availability from an invalid API key", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-only-token");
    const fetchMock = vi.fn().mockResolvedValue(json({ error: "Unauthorized" }, 401));
    vi.stubGlobal("fetch", fetchMock);
    expect(await checkGroqHealth()).toMatchObject({ configured: true, modelAvailable: false });
    await expect(executeGroqExtraction(input)).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces sanitized schema rejection details on HTTP 400 without exposing keys or notes", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-only-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(catalog())
      .mockResolvedValueOnce(json({ error: { message: "Failed to validate schema: missing required property 'sourceTitle'" } }, 400));
    vi.stubGlobal("fetch", fetchMock);
    await expect(executeGroqExtraction(input)).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("missing required property 'sourceTitle'"),
    });
  });
});
