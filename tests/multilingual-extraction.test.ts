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

    it("preserves exact semantic meaning of Cebuano tools without substituting shovels for brooms", () => {
      const notes = "Oplan Kalimpyo: Mangita og sako, gloves, ug silhig para sa pagpanglimpyo sa Sabado.";
      const raw = RawExtractionResponseSchema.parse({
        summary: "Community cleanup drive preparations.",
        actionItems: [
          {
            title: "Prepare sacks, gloves, and brooms",
            sourceTitle: "Mangita og sako, gloves, ug silhig",
            description: "Prepare sacks, gloves, and brooms for the cleanup drive",
            assignees: [],
            originalDeadlineText: "sa Sabado",
            deadlineRelation: "by",
            commitmentStatus: "confirmed",
            priority: "medium",
            evidenceQuote: "Mangita og sako, gloves, ug silhig para sa pagpanglimpyo sa Sabado.",
            missingInformation: ["assignee"],
          },
        ],
        decisions: [],
        openQuestions: [],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Cleanup Drive", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );

      const task = meeting.actionItems[0];
      // Title must reflect brooms (silhig) and sacks (sako), not shovels
      expect(task.title.toLowerCase()).toContain("brooms");
      expect(task.title.toLowerCase()).toContain("sacks");
      expect(task.title.toLowerCase()).not.toContain("shovel");
      expect(task.sourceTitle).toBe("Mangita og sako, gloves, ug silhig");
      expect(task.evidence[0].quote).toBe("Mangita og sako, gloves, ug silhig para sa pagpanglimpyo sa Sabado.");
      expect(task.evidence[0].isVerified).toBe(true);
      // Review status MUST be pending - never automatically approved
      expect(task.reviewStatus).toBe("pending");
      // Unassigned task correctly has empty assignees and flags missing assignee
      expect(task.assignees).toEqual([]);
      expect(task.missingInformation).toContain("assignee");
      expect(task.needsReview).toBe(true);
    });

    it("ensures all extracted tasks, decisions, and questions start as pending review", () => {
      const notes = "Si Sarah ang magdala og pala. Nagkasabot nga mag-meeting sa Sabado. Kinsa ang mag-lead?";
      const raw = RawExtractionResponseSchema.parse({
        summary: "Meeting test",
        actionItems: [
          {
            title: "Bring shovel",
            sourceTitle: "magdala og pala",
            description: null,
            assignees: ["Sarah"],
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Si Sarah ang magdala og pala.",
            missingInformation: ["deadline"],
          },
        ],
        decisions: [
          {
            decision: "Meet on Saturday",
            evidenceQuote: "Nagkasabot nga mag-meeting sa Sabado.",
          },
        ],
        openQuestions: [
          {
            question: "Who will lead the meeting?",
            evidenceQuote: "Kinsa ang mag-lead?",
          },
        ],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Review Status Test", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );

      expect(meeting.actionItems[0].reviewStatus).toBe("pending");
      expect(meeting.decisions[0].reviewStatus).toBe("pending");
      expect(meeting.openQuestions[0].reviewStatus).toBe("pending");
    });

    it("resolves first-person Cebuano commitment to speaker Liza with deadline October 27", () => {
      const notes = `Liza: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27."`;
      const raw = RawExtractionResponseSchema.parse({
        summary: "Poster preparation.",
        actionItems: [
          {
            title: "Create poster",
            sourceTitle: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27.",
            description: "Create the event poster and submit by October 27",
            assignees: ["Liza"],
            originalDeadlineText: "sa Oktubre 27",
            deadlineRelation: "by",
            commitmentStatus: "confirmed",
            priority: "high",
            // Notice: evidence quote without speaker label tests speaker turn resolution
            evidenceQuote: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27.",
            missingInformation: [],
          },
        ],
        decisions: [],
        openQuestions: [],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Poster Sync", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );

      expect(meeting.actionItems).toHaveLength(1);
      const task = meeting.actionItems[0];
      expect(task.title).toBe("Create poster");
      expect(task.assignees).toEqual(["Liza"]);
      expect(task.deadline.date).toBe("2026-10-27");
      expect(task.deadline.isAmbiguous).toBe(false);
      expect(task.reviewStatus).toBe("pending");
      expect(task.evidence[0].isVerified).toBe(true);
      expect(meeting.warnings).toHaveLength(0);
    });

    it("distinguishes checking prices from purchasing and preserves unresolved budget question for Jun", () => {
      const notes = `Jun: "Mangita ko og presyo sa gloves ug mga sako, pero wala pa ta kasabot sa pinal nga badyet."`;
      const raw = RawExtractionResponseSchema.parse({
        summary: "Inquiring about supply prices.",
        actionItems: [
          {
            title: "Check prices of gloves and sacks",
            sourceTitle: "Mangita ko og presyo sa gloves ug mga sako",
            description: "Look for supply prices for gloves and sacks",
            assignees: ["Jun"],
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Mangita ko og presyo sa gloves ug mga sako, pero wala pa ta kasabot sa pinal nga badyet.",
            missingInformation: ["deadline"],
          },
        ],
        decisions: [],
        openQuestions: [
          {
            question: "What is the final budget for supplies?",
            evidenceQuote: "wala pa ta kasabot sa pinal nga badyet.",
          },
        ],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Supply Inquiries", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );

      const task = meeting.actionItems[0];
      expect(task.title).toBe("Check prices of gloves and sacks");
      expect(task.assignees).toEqual(["Jun"]);
      expect(task.deadline.date).toBeNull();
      expect(task.reviewStatus).toBe("pending");
      // Unresolved budget preserved as open question
      expect(meeting.openQuestions).toHaveLength(1);
      expect(meeting.openQuestions[0].question).toBe("What is the final budget for supplies?");
      expect(meeting.openQuestions[0].evidence[0].isVerified).toBe(true);
    });

    it("blocks hallucinated owners when speaker turn does not match assignee", () => {
      const notes = `Liza: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27."`;
      const raw = RawExtractionResponseSchema.parse({
        summary: "Poster preparation.",
        actionItems: [
          {
            title: "Create poster",
            sourceTitle: "maghimo sa poster",
            description: null,
            assignees: ["Carlos"], // Invented assignee not in turn
            originalDeadlineText: "sa Oktubre 27",
            deadlineRelation: "by",
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27.",
            missingInformation: [],
          },
        ],
        decisions: [],
        openQuestions: [],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Poster Sync", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );

      // Carlos was not in quote and not the speaker, so must be stripped
      expect(meeting.actionItems[0].assignees).toEqual([]);
      expect(meeting.actionItems[0].missingInformation).toContain("assignee");
      expect(meeting.warnings.some((w) => w.includes("unsupported by the citation"))).toBe(true);
    });

    it("resolves Mark first-person permit commitment with confirmed status and pending review", () => {
      const notes = `Mark: "Sige, ako na ang moasikaso sa permiso."`;
      const raw = RawExtractionResponseSchema.parse({
        summary: "Permit handling.",
        actionItems: [
          {
            title: "Handle permit application",
            sourceTitle: "ako na ang moasikaso sa permiso",
            description: "Mark will process the permit",
            assignees: ["Mark"],
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Sige, ako na ang moasikaso sa permiso.",
            missingInformation: ["deadline"],
          },
        ],
        decisions: [],
        openQuestions: [],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Permit Sync", rawText: notes, meetingDate: "2026-10-23" },
        raw,
      );

      expect(meeting.actionItems).toHaveLength(1);
      const task = meeting.actionItems[0];
      expect(task.title).toBe("Handle permit application");
      expect(task.assignees).toEqual(["Mark"]);
      expect(task.reviewStatus).toBe("pending");
      expect(task.evidence[0].isVerified).toBe(true);
    });

    it("accurately attributes Liza, Jun, and Mark in a multi-speaker conversation with bullet lists and wrapped text", () => {
      const notes = `Tigom sa Barangay Kalimpyo
Mga Mitambong: Liza, Jun, Mark

- Liza: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27."
- Jun: "Mangita ko og presyo sa gloves ug mga sako, pero wala pa ta kasabot sa pinal nga badyet."
- Mark: "Sige, ako na ang moasikaso sa permiso."`;

      const raw = RawExtractionResponseSchema.parse({
        summary: "Community cleanup planning with Liza, Jun, and Mark.",
        actionItems: [
          {
            title: "Create poster",
            sourceTitle: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27.",
            description: "Liza creates and submits poster by Oct 27",
            assignees: ["Liza"],
            originalDeadlineText: "sa Oktubre 27",
            deadlineRelation: "by",
            commitmentStatus: "confirmed",
            priority: "high",
            evidenceQuote: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27.",
            missingInformation: [],
          },
          {
            title: "Check prices of gloves and sacks",
            sourceTitle: "Mangita ko og presyo sa gloves ug mga sako",
            description: "Jun checks supply prices. Inquiry only, not purchase.",
            assignees: ["Jun"],
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Mangita ko og presyo sa gloves ug mga sako, pero wala pa ta kasabot sa pinal nga badyet.",
            missingInformation: ["deadline"],
          },
          {
            title: "Handle permit application",
            sourceTitle: "ako na ang moasikaso sa permiso",
            description: "Mark secures the cleanup permit",
            assignees: ["Mark"],
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Sige, ako na ang moasikaso sa permiso.",
            missingInformation: ["deadline"],
          },
        ],
        decisions: [],
        openQuestions: [
          {
            question: "What is the final budget for supplies?",
            evidenceQuote: "wala pa ta kasabot sa pinal nga badyet",
          },
        ],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Barangay Cleanup", rawText: notes, meetingDate: "2026-10-20" },
        raw,
      );

      expect(meeting.actionItems).toHaveLength(3);

      const lizaTask = meeting.actionItems.find((t) => t.assignees.includes("Liza"));
      expect(lizaTask).toBeDefined();
      expect(lizaTask!.title).toBe("Create poster");
      expect(lizaTask!.deadline.date).toBe("2026-10-27");
      expect(lizaTask!.reviewStatus).toBe("pending");

      const junTask = meeting.actionItems.find((t) => t.assignees.includes("Jun"));
      expect(junTask).toBeDefined();
      expect(junTask!.title).toBe("Check prices of gloves and sacks");
      expect(junTask!.deadline.date).toBeNull();
      expect(junTask!.reviewStatus).toBe("pending");

      const markTask = meeting.actionItems.find((t) => t.assignees.includes("Mark"));
      expect(markTask).toBeDefined();
      expect(markTask!.title).toBe("Handle permit application");
      expect(markTask!.reviewStatus).toBe("pending");

      // Verify no warning for any valid assignee
      expect(meeting.warnings).toHaveLength(0);
    });

    it("prevents attributing a task to a previous speaker when evidence crosses speaker boundaries", () => {
      const notes = `Liza: "Ako ang maghimo sa poster." Jun: "Mangita ko og presyo sa gloves ug mga sako."`;
      const raw = RawExtractionResponseSchema.parse({
        summary: "Dialogue sync.",
        actionItems: [
          {
            title: "Check supply prices",
            sourceTitle: "Mangita ko og presyo sa gloves ug mga sako",
            description: "Jun inquires about supply prices",
            assignees: ["Jun"],
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "confirmed",
            priority: null,
            // Quote starts in Liza's turn but contains Jun's commitment
            evidenceQuote: 'sa poster." Jun: "Mangita ko og presyo sa gloves ug mga sako.',
            missingInformation: ["deadline"],
          },
        ],
        decisions: [],
        openQuestions: [],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Dialogue Sync", rawText: notes, meetingDate: "2026-10-20" },
        raw,
      );

      // Jun is correctly assigned to his portion, not overridden by Liza
      expect(meeting.actionItems[0].assignees).toEqual(["Jun"]);
      expect(meeting.warnings).toHaveLength(0);
    });

    it("does not assign a task to someone merely because they are mentioned nearby", () => {
      const notes = `Celia: "Nakig-istorya ko ni Jun bahin sa supplies kagahapon pero si Liza na ang final sa venue."`;
      const raw = RawExtractionResponseSchema.parse({
        summary: "Venue coordination.",
        actionItems: [
          {
            title: "Coordinate supplies",
            sourceTitle: "Nakig-istorya ko ni Jun",
            description: "Mention of Jun in conversation",
            assignees: ["Jun"], // Jun was only mentioned ("ni Jun"), not assigned
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "Nakig-istorya ko ni Jun bahin sa supplies",
            missingInformation: [],
          },
          {
            title: "Finalize venue",
            sourceTitle: "si Liza na ang final sa venue",
            description: "Liza assigned to venue",
            assignees: ["Liza"], // Explicit third-person assignment ("si Liza na")
            originalDeadlineText: null,
            deadlineRelation: null,
            commitmentStatus: "confirmed",
            priority: null,
            evidenceQuote: "si Liza na ang final sa venue",
            missingInformation: [],
          },
        ],
        decisions: [],
        openQuestions: [],
        nextMeetingText: null,
      });

      const meeting = assembleMeetingExtraction(
        { title: "Venue Sync", rawText: notes, meetingDate: "2026-10-20" },
        raw,
      );

      // Jun is stripped because he was merely mentioned nearby without task assignment
      const suppliesTask = meeting.actionItems.find((t) => t.title === "Coordinate supplies");
      expect(suppliesTask!.assignees).toEqual([]);
      expect(suppliesTask!.missingInformation).toContain("assignee");

      // Liza is retained because of explicit third-person assignment ("si Liza na")
      const venueTask = meeting.actionItems.find((t) => t.title === "Finalize venue");
      expect(venueTask!.assignees).toEqual(["Liza"]);
    });
  });
});
