import { describe, expect, it } from "vitest";
import { assembleMeetingExtraction } from "../src/server/services/extraction-core";
import { RawExtractionResponseSchema } from "../src/types/meeting";

const source = "[10:00] Maria: I will draft the poster tomorrow.\r\nNo shirts will be ordered.";
const input = { title: "Sync", rawText: source, meetingDate: "2026-10-23" };
const empty = { summary: "No actions", actionItems: [], decisions: [], openQuestions: [] };
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
