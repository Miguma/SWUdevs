import { describe, it, expect } from "vitest";
import {
  assembleMeetingExtraction,
  buildExtractionPrompt,
  EXTRACTION_SYSTEM_PROMPT,
} from "../src/server/services/extraction-core";
import { RawExtractionResponseSchema } from "../src/types/meeting";

describe("Multilingual AI Intelligence & Intent Recognition", () => {
  it("includes comprehensive multilingual guidance in system prompt", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("Cebuano (Bisaya)");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("Tagalog (Filipino)");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("Bislish");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("Taglish");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("daw");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("kuno");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("commitmentStatus");
    expect(EXTRACTION_SYSTEM_PROMPT.toLowerCase()).toContain("english-first");
  });

  it("assembles confirmed Bisaya and Tagalog tasks with English titles and original source wording", () => {
    const rawNotes = `Si Mark magdala ug speaker ugma.\nSi Ana na ang bahala sa pagkain sa biyernes.`;
    const meetingDate = "2026-10-23";

    const rawModelOutput = RawExtractionResponseSchema.parse({
      summary: "Coordination meeting for event preparations.",
      actionItems: [
        {
          title: "Bring speaker",
          sourceTitle: "magdala ug speaker",
          description: "Bring audio speaker for the event",
          assignees: ["Mark"],
          originalDeadlineText: "ugma",
          deadlineRelation: "by",
          commitmentStatus: "confirmed",
          priority: "high",
          evidenceQuote: "Si Mark magdala ug speaker ugma.",
          missingInformation: [],
        },
        {
          title: "Handle catering and food",
          sourceTitle: "bahala sa pagkain",
          description: "Coordinate meals and refreshments",
          assignees: ["Ana"],
          originalDeadlineText: "sa biyernes",
          deadlineRelation: "on",
          commitmentStatus: "confirmed",
          priority: "medium",
          evidenceQuote: "Si Ana na ang bahala sa pagkain sa biyernes.",
          missingInformation: [],
        },
      ],
      decisions: [],
      openQuestions: [],
      nextMeetingText: null,
    });

    const result = assembleMeetingExtraction(
      { title: "Event Prep", rawText: rawNotes, meetingDate, timezone: "Asia/Manila" },
      rawModelOutput,
    );

    expect(result.actionItems).toHaveLength(2);

    const task1 = result.actionItems[0];
    expect(task1.title).toBe("Bring speaker");
    expect(task1.sourceTitle).toBe("magdala ug speaker");
    expect(task1.assignees).toEqual(["Mark"]);
    expect(task1.commitmentStatus).toBe("confirmed");
    expect(task1.deadline.date).toBe("2026-10-24"); // Oct 23 + 1 (ugma)
    expect(task1.evidence[0].isVerified).toBe(true);

    const task2 = result.actionItems[1];
    expect(task2.title).toBe("Handle catering and food");
    expect(task2.sourceTitle).toBe("bahala sa pagkain");
    expect(task2.assignees).toEqual(["Ana"]);
    expect(task2.commitmentStatus).toBe("confirmed");
    expect(task2.deadline.date).toBe("2026-10-23"); // Friday (same day)
    expect(task2.evidence[0].isVerified).toBe(true);
  });

  it("handles proposed commitments from Taglish/Bislish suggestions", () => {
    const rawNotes = `Maybe si Carlo na lang sa presentation.`;
    const rawModelOutput = RawExtractionResponseSchema.parse({
      summary: "Discussion on presenter.",
      actionItems: [
        {
          title: "Deliver project presentation",
          sourceTitle: "presentation",
          description: null,
          assignees: ["Carlo"],
          originalDeadlineText: null,
          deadlineRelation: null,
          commitmentStatus: "proposed",
          priority: null,
          evidenceQuote: "Maybe si Carlo na lang sa presentation.",
          missingInformation: [],
        },
      ],
      decisions: [],
      openQuestions: [],
      nextMeetingText: null,
    });

    const result = assembleMeetingExtraction(
      { title: "Presentation Sync", rawText: rawNotes },
      rawModelOutput,
    );

    expect(result.actionItems[0].commitmentStatus).toBe("proposed");
    expect(result.actionItems[0].needsReview).toBe(true); // Proposed tasks flag review
  });

  it("flags uncertain or secondhand commitments ('daw' / 'kuno') as unclear", () => {
    const rawNotes = `Si Khen daw bahala sa drinks.`;
    const rawModelOutput = RawExtractionResponseSchema.parse({
      summary: "Refreshment assignments.",
      actionItems: [
        {
          title: "Coordinate drinks",
          sourceTitle: "bahala sa drinks",
          description: "Unconfirmed secondhand assignment",
          assignees: ["Khen"],
          originalDeadlineText: null,
          deadlineRelation: null,
          commitmentStatus: "unclear",
          priority: null,
          evidenceQuote: "Si Khen daw bahala sa drinks.",
          missingInformation: ["confirmation"],
        },
      ],
      decisions: [],
      openQuestions: [],
      nextMeetingText: null,
    });

    const result = assembleMeetingExtraction(
      { title: "Drinks Sync", rawText: rawNotes },
      rawModelOutput,
    );

    expect(result.actionItems[0].commitmentStatus).toBe("unclear");
    expect(result.actionItems[0].needsReview).toBe(true);
  });

  it("handles corrected assignments by taking the final superseded owner", () => {
    const rawNotes = `Si Ana sa poster. Ay, si Mark na lang diay.`;
    const rawModelOutput = RawExtractionResponseSchema.parse({
      summary: "Poster design assignment.",
      actionItems: [
        {
          title: "Design event poster",
          sourceTitle: "poster",
          description: "Reassigned to Mark after initial mention of Ana",
          assignees: ["Mark"],
          originalDeadlineText: null,
          deadlineRelation: null,
          commitmentStatus: "confirmed",
          priority: null,
          evidenceQuote: "Si Ana sa poster. Ay, si Mark na lang diay.",
          missingInformation: [],
        },
      ],
      decisions: [],
      openQuestions: [],
      nextMeetingText: null,
    });

    const result = assembleMeetingExtraction(
      { title: "Poster Design", rawText: rawNotes },
      rawModelOutput,
    );

    expect(result.actionItems[0].assignees).toEqual(["Mark"]);
    expect(result.actionItems[0].evidence[0].isVerified).toBe(true);
  });

  it("records cancellations as decisions rather than active tasks", () => {
    const rawNotes = `Dili na ta mag-order ug shirts kay mahal kaayo.`;
    const rawModelOutput = RawExtractionResponseSchema.parse({
      summary: "Shirt budget discussion.",
      actionItems: [], // No active task!
      decisions: [
        {
          decision: "Decided not to order shirts due to high cost",
          evidenceQuote: "Dili na ta mag-order ug shirts kay mahal kaayo.",
        },
      ],
      openQuestions: [],
      nextMeetingText: null,
    });

    const result = assembleMeetingExtraction(
      { title: "Merchandise Sync", rawText: rawNotes },
      rawModelOutput,
    );

    expect(result.actionItems).toHaveLength(0);
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0].decision).toContain("not to order shirts");
    expect(result.decisions[0].evidence[0].isVerified).toBe(true);
  });

  describe("Multilingual verification across English, Cebuano, and Tagalog", () => {
    it("processes English meeting notes accurately", () => {
      const notes = "Sprint kickoff: Alice will finalize the API contract by tomorrow. Bob will set up the test runner.";
      const raw = RawExtractionResponseSchema.parse({
        summary: "Sprint kickoff for API development.",
        actionItems: [
          {
            title: "Finalize API contract",
            sourceTitle: "finalize the API contract",
            description: null,
            assignees: ["Alice"],
            originalDeadlineText: "tomorrow",
            deadlineRelation: "by",
            commitmentStatus: "confirmed",
            priority: "high",
            evidenceQuote: "Alice will finalize the API contract by tomorrow.",
            missingInformation: [],
          },
        ],
        decisions: [],
        openQuestions: [],
        nextMeetingText: null,
      });
      const meeting = assembleMeetingExtraction(
        { title: "English Sync", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );
      expect(meeting.actionItems[0].title).toBe("Finalize API contract");
      expect(meeting.actionItems[0].sourceTitle).toBe("finalize the API contract");
      expect(meeting.actionItems[0].deadline.date).toBe("2026-10-24");
      expect(meeting.actionItems[0].evidence[0].isVerified).toBe(true);
    });

    it("processes Cebuano meeting notes accurately with English-first titles", () => {
      const notes = "Panagtagbo: Si Nonoy ang mopalit og mga materyales ugma. Nagkasabot nga magtigom sa barangay hall.";
      const raw = RawExtractionResponseSchema.parse({
        summary: "Meeting regarding materials purchase and venue agreement.",
        actionItems: [
          {
            title: "Purchase required materials",
            sourceTitle: "mopalit og mga materyales",
            description: null,
            assignees: ["Nonoy"],
            originalDeadlineText: "ugma",
            deadlineRelation: "by",
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Si Nonoy ang mopalit og mga materyales ugma.",
            missingInformation: [],
          },
        ],
        decisions: [
          {
            decision: "Meet at the barangay hall",
            evidenceQuote: "Nagkasabot nga magtigom sa barangay hall.",
          },
        ],
        openQuestions: [],
        nextMeetingText: null,
      });
      const meeting = assembleMeetingExtraction(
        { title: "Cebuano Sync", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );
      expect(meeting.actionItems[0].title).toBe("Purchase required materials");
      expect(meeting.actionItems[0].sourceTitle).toBe("mopalit og mga materyales");
      expect(meeting.actionItems[0].assignees).toEqual(["Nonoy"]);
      expect(meeting.actionItems[0].deadline.date).toBe("2026-10-24");
      expect(meeting.decisions[0].decision).toBe("Meet at the barangay hall");
    });

    it("processes Tagalog meeting notes accurately with English-first titles", () => {
      const notes = "Pagpupulong: Si Kuya Ben ang magluluto ng pagkain sa Lunes. Baka pwede si Lisa sa pamamalengke.";
      const raw = RawExtractionResponseSchema.parse({
        summary: "Event food preparation coordination.",
        actionItems: [
          {
            title: "Cook food for the event",
            sourceTitle: "magluluto ng pagkain",
            description: null,
            assignees: ["Kuya Ben"],
            originalDeadlineText: "sa Lunes",
            deadlineRelation: "on",
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Si Kuya Ben ang magluluto ng pagkain sa Lunes.",
            missingInformation: [],
          },
          {
            title: "Shop for ingredients",
            sourceTitle: "pamamalengke",
            description: null,
            assignees: ["Lisa"],
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "proposed",
            priority: null,
            evidenceQuote: "Baka pwede si Lisa sa pamamalengke.",
            missingInformation: [],
          },
        ],
        decisions: [],
        openQuestions: [],
        nextMeetingText: null,
      });
      const meeting = assembleMeetingExtraction(
        { title: "Tagalog Sync", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );
      expect(meeting.actionItems[0].title).toBe("Cook food for the event");
      expect(meeting.actionItems[0].sourceTitle).toBe("magluluto ng pagkain");
      expect(meeting.actionItems[0].deadline.date).toBe("2026-10-26");
      expect(meeting.actionItems[1].commitmentStatus).toBe("proposed");
      expect(meeting.actionItems[1].assignees).toEqual(["Lisa"]);
    });
  });
});
