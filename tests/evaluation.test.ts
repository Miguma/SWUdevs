import { describe, expect, it, vi, afterEach } from "vitest";
import {
  aggregateScores,
  scoreCase,
  titleSimilarity,
  type BenchmarkCase,
} from "../eval/metrics";
import { assembleMeetingExtraction } from "../src/server/services/extraction-core";
import { RawExtractionResponseSchema } from "../src/types/meeting";

const tc: BenchmarkCase = {
  id: "independent",
  language: "english",
  category: "owner",
  meetingDate: "2026-10-23",
  timezone: "Asia/Manila",
  notes: "Maria and Jun will draft the poster tomorrow.",
  groundTruth: {
    expectedTasks: [
      {
        title: "Draft poster",
        assignees: ["Maria", "Jun"],
        expectedDeadlineDate: "2026-10-24",
        status: "confirmed",
      },
    ],
    expectedDecisions: [],
    expectedOpenQuestions: [],
  },
};
const prediction = () =>
  assembleMeetingExtraction(
    { title: "Test", rawText: tc.notes, meetingDate: tc.meetingDate! },
    RawExtractionResponseSchema.parse({
      summary: "",
      actionItems: [],
      decisions: [],
      openQuestions: [],
    }),
  );
afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("Honest model scoring", () => {
  it("keeps an empty prediction empty and counts missed actions", () => {
    const actual = prediction();
    const score = scoreCase(actual, tc);
    expect(actual.actionItems).toEqual([]);
    expect(score.tasks).toEqual({ predicted: 0, expected: 1, matched: 0 });
    expect(aggregateScores([score]).tasks).toMatchObject({
      recall: 0,
      f1: 0,
      precision: null,
    });
  });
  it("does not match blank or overly generic one-word predictions", () => {
    expect(titleSimilarity("", "Draft poster")).toBe(0);
    expect(
      titleSimilarity("poster", "Finalize accessible event poster"),
    ).toBeLessThan(0.6);
  });
  it("requires an exact owner set and scores duplicate predictions as false positives", () => {
    const actual = assembleMeetingExtraction(
      { title: "Test", rawText: tc.notes, meetingDate: tc.meetingDate! },
      RawExtractionResponseSchema.parse({
        summary: "",
        actionItems: [
          {
            title: "Draft poster",
            assignees: ["Maria"],
            originalDeadlineText: "tomorrow",
            evidenceQuote: tc.notes,
          },
        ],
        decisions: [],
        openQuestions: [],
      }),
    );
    actual.actionItems.push({ ...actual.actionItems[0], id: "duplicate" });
    const score = scoreCase(actual, tc);
    expect(score.correctOwners).toBe(0);
    expect(score.tasks).toEqual({ predicted: 2, expected: 1, matched: 1 });
    expect(aggregateScores([score]).tasks.precision).toBe(0.5);
  });
  it("recomputes source validity and reports null accuracy when no items were emitted", () => {
    const actual = prediction();
    actual.decisions.push({
      id: "invented",
      decision: "Spend budget",
      evidence: [
        {
          quote: "A fabricated quotation",
          startOffset: 0,
          endOffset: 22,
          isVerified: true,
        },
      ],
      needsReview: false,
      reviewStatus: "pending",
    });
    expect(scoreCase(actual, tc).verifiedItems).toBe(0);
    expect(aggregateScores([]).evidenceValidity).toBeNull();
  });
  it("cloud runner uses the pinned model and scores only its actual prediction", async () => {
    const writes: Record<string, string> = {};
    const infer = vi.fn(async () => prediction());
    vi.doMock("node:fs", () => ({
      default: {
        readFileSync: () => JSON.stringify([tc]),
        writeFileSync: (file: string, value: string) => {
          writes[file] = value;
        },
      },
    }));
    vi.doMock("../src/server/services/huggingface-client", () => ({
      checkHuggingFaceHealth: async () => ({
        configured: true,
        modelAvailable: true,
        model: "Qwen/Qwen3-32B",
        provider: "deepinfra",
      }),
      executeHuggingFaceExtraction: infer,
    }));
    try {
      await import("../eval/run-model-eval");
      await vi.waitFor(() => expect(Object.keys(writes)).toHaveLength(2));
      expect(infer).toHaveBeenCalledWith({
        title: "Eval independent",
        meetingDate: tc.meetingDate,
        timezone: tc.timezone,
        rawText: tc.notes,
        model: "Qwen/Qwen3-32B",
      });
      const report = JSON.parse(Object.entries(writes).find(([key]) => key.endsWith(".json"))![1]);
      expect(report).toMatchObject({ status: "COMPLETE", provider: "huggingface", model: "Qwen/Qwen3-32B" });
      expect(report.metrics.tasks.recall).toBe(0);
      expect(report.predictions[0].prediction.actionItems).toEqual([]);
    } finally {
      vi.doUnmock("node:fs");
      vi.doUnmock("../src/server/services/huggingface-client");
    }
  });
});
