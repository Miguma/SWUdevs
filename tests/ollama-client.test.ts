import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assembleMeetingExtraction,
  checkOllamaHealth,
  executeOllamaExtraction,
} from "../src/server/services/ollama-client";
import { RawExtractionResponseSchema } from "../src/types/meeting";

const source =
  "[10:00] Maria: I will draft the poster tomorrow.\r\nNo shirts will be ordered.";
const input = {
  title: "Sync",
  rawText: source,
  meetingDate: "2026-10-23",
  model: "qwen3:4b",
};
const empty = {
  summary: "No actions",
  actionItems: [],
  decisions: [],
  openQuestions: [],
};
const response = (value: unknown) =>
  new Response(JSON.stringify(value), { status: 200 });
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Explicit local inference", () => {
  it("refuses missing models even when another supported model is installed", async () => {
    fetchMock.mockResolvedValue(response({ models: [{ name: "qwen2.5:3b" }] }));
    await expect(executeOllamaExtraction(input)).rejects.toMatchObject({
      status: 422,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("uses exactly the selected model and preserves the source and actual analysis metadata", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ models: [{ name: input.model }] }))
      .mockResolvedValueOnce(
        response({ message: { content: JSON.stringify(empty) } }),
      );
    const result = await executeOllamaExtraction(input);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.model).toBe(input.model);
    expect(body.think).toBe(false);
    expect(result.rawTranscript).toBe(source);
    expect(result.analysis?.model).toBe(input.model);
    expect(result.actionItems).toEqual([]);
  });
  it("excludes cloud-backed models and requires an exact installed tag", async () => {
    fetchMock.mockResolvedValue(
      response({
        models: [
          { name: "qwen3:4b:extra" },
          { name: "remote:cloud", remote_host: "https://example.com" },
        ],
      }),
    );
    const health = await checkOllamaHealth("qwen3:4b");
    expect(health.modelAvailable).toBe(false);
    expect(health.availableModels).toEqual(["qwen3:4b:extra"]);
  });
  it.each(["{}", "not json"])(
    "rejects incomplete structured output: %s",
    async (content) => {
      fetchMock
        .mockResolvedValueOnce(response({ models: [{ name: input.model }] }))
        .mockResolvedValueOnce(response({ message: { content } }));
      await expect(executeOllamaExtraction(input)).rejects.toMatchObject({
        status: 502,
      });
    },
  );
  it("rejects truncated output without presenting a partial action plan", async () => {
    fetchMock
      .mockResolvedValueOnce(response({ models: [{ name: input.model }] }))
      .mockResolvedValueOnce(
        response({
          done_reason: "length",
          message: { content: JSON.stringify(empty) },
        }),
      );
    await expect(executeOllamaExtraction(input)).rejects.toMatchObject({
      status: 502,
    });
  });
  it("reserves capacity before health requests finish and releases slots after failure", async () => {
    let release!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    );
    const first = executeOllamaExtraction(input).catch((error) => error);
    let releaseSecond!: (value: Response) => void;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          releaseSecond = resolve;
        }),
    );
    const second = executeOllamaExtraction(input).catch((error) => error);
    await expect(executeOllamaExtraction(input)).rejects.toMatchObject({
      status: 429,
    });
    release(response({ models: [] }));
    releaseSecond(response({ models: [] }));
    await first;
    await second;
    fetchMock.mockResolvedValue(response({ models: [] }));
    await expect(executeOllamaExtraction(input)).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe("Field-level source support", () => {
  it("removes invented owners and deadlines even when the quote itself is real", () => {
    const raw = RawExtractionResponseSchema.parse({
      ...empty,
      actionItems: [
        {
          title: "Draft poster",
          assignees: ["Ann"],
          originalDeadlineText: "next Monday",
          evidenceQuote: "Maria: I will draft the poster tomorrow.",
        },
      ],
    });
    const task = assembleMeetingExtraction(input, raw).actionItems[0];
    expect(task.assignees).toEqual([]);
    expect(task.deadline.date).toBeNull();
    expect(task.needsReview).toBe(true);
  });
  it("keeps a speaker-based Cebuano owner and resolves ugma without inventing an hour", () => {
    const rawText = "Kath: ako mokuha sa permit ugma sa buntag.";
    const raw = RawExtractionResponseSchema.parse({
      ...empty,
      actionItems: [
        {
          title: "Mokuha sa permit",
          assignees: ["Kath"],
          originalDeadlineText: "ugma sa buntag",
          evidenceQuote: rawText,
        },
      ],
    });
    const task = assembleMeetingExtraction({ ...input, rawText }, raw)
      .actionItems[0];
    expect(task.assignees).toEqual(["Kath"]);
    expect(task.deadline.date).toBe("2026-10-24");
    expect(task.deadline.time).toBeNull();
  });
  it("collapses exact duplicate commitments and never fabricates evidence offsets", () => {
    const item = {
      title: "Draft poster",
      assignees: ["Maria"],
      originalDeadlineText: "tomorrow",
      evidenceQuote: source.split("\r\n")[0],
    };
    const result = assembleMeetingExtraction(
      input,
      RawExtractionResponseSchema.parse({
        ...empty,
        actionItems: [item, item],
      }),
    );
    expect(result.actionItems).toHaveLength(1);
    const ev = result.actionItems[0].evidence[0];
    expect(source.slice(ev.startOffset!, ev.endOffset!)).toBe(ev.quote);
  });
});
