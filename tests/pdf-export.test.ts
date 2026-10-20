import { describe, it, expect } from "vitest";
import {
  generateMeetingPdf,
  sanitizePdfText,
  exportMeetingToPdf,
} from "../src/lib/pdf-export";
import { MeetingExtraction, ActionItem } from "../src/types/meeting";
import { POST as exportHandler } from "../src/app/api/meetings/[id]/export/route";
import { NextRequest } from "next/server";

function getPdfRawText(doc: ReturnType<typeof generateMeetingPdf>): string {
  const buffer = Buffer.from(doc.output("arraybuffer"));
  return buffer.toString("latin1");
}

describe("PDF Export Service — Design, Branding, and Data Integrity", () => {
  const createBaseMeeting = (overrides?: Partial<MeetingExtraction>): MeetingExtraction => ({
    id: "meeting-101",
    title: "Community Outreach Strategy Session",
    organization: "SWUdevs Core Team",
    meetingDate: "2026-10-23",
    timezone: "Asia/Manila",
    rawTranscript: "Mock transcript of the session...",
    summary: "Discussion and planning for upcoming outreach drive in Cebu.",
    actionItems: [
      {
        id: "task-1",
        title: "Coordinate with barangay officials for permit",
        description: "Secure local council permit and venue access",
        assignees: ["Mark", "Ana"],
        deadline: {
          originalText: "ugma",
          date: "2026-10-24",
          time: "14:00",
          timezone: "Asia/Manila",
          relation: "by",
          isAmbiguous: false,
        },
        commitmentStatus: "confirmed",
        priority: "high",
        status: "in_progress",
        evidence: [
          {
            quote: "Si Mark ug Ana magkuha ug permit sa barangay ugma.",
            startOffset: 0,
            endOffset: 52,
            isVerified: true,
            provenance: "exact_match",
          },
        ],
        missingInformation: [],
        needsReview: false,
        reviewStatus: "approved",
      },
      {
        id: "task-2",
        title: "Purchase hygiene supplies and soap",
        description: null,
        assignees: ["Khen"],
        deadline: {
          originalText: "karong biyernes",
          date: "2026-10-26",
          time: null,
          timezone: "Asia/Manila",
          relation: "on",
          isAmbiguous: false,
        },
        commitmentStatus: "confirmed",
        priority: "medium",
        status: "completed",
        evidence: [
          {
            quote: "Khen will purchase hygiene kits on Friday.",
            startOffset: 60,
            endOffset: 102,
            isVerified: true,
            provenance: "exact_match",
          },
        ],
        missingInformation: [],
        needsReview: false,
        reviewStatus: "approved",
      },
    ],
    decisions: [
      {
        id: "dec-1",
        decision: "Set maximum budget to PHP 25,000 for event logistics",
        evidence: [
          {
            quote: "The core committee agreed on a 25k PHP ceiling.",
            startOffset: 120,
            endOffset: 168,
            isVerified: true,
            provenance: "exact_match",
          },
        ],
        needsReview: false,
        reviewStatus: "approved",
      },
    ],
    openQuestions: [
      {
        id: "q-1",
        question: "How many transport vans will be required?",
        status: "open",
        answer: null,
        evidence: [],
        needsReview: false,
        reviewStatus: "approved",
      },
    ],
    nextMeeting: {
      date: "2026-10-30",
      time: "09:00",
      originalText: "Next Friday 9am",
      timezone: "Asia/Manila",
      relation: "on",
      isAmbiguous: false,
    },
    warnings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  // 1. Empty meetings
  it("handles empty meetings gracefully without errors", () => {
    const emptyMeeting: MeetingExtraction = {
      id: "empty-1",
      title: "Quick Sync Without Action Items",
      organization: undefined,
      meetingDate: undefined,
      timezone: "Asia/Manila",
      rawTranscript: "",
      summary: "",
      actionItems: [],
      decisions: [],
      openQuestions: [],
      nextMeeting: null,
      warnings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const doc = generateMeetingPdf(emptyMeeting);
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(1);

    const pdfText = getPdfRawText(doc);
    expect(pdfText).toContain("TAMBAYAYONG");
    expect(pdfText).toContain("Quick Sync Without Action Items");
    expect(pdfText).toContain("No action items available for export.");
    expect(pdfText).toContain("No formal decisions were recorded in this session.");
    expect(pdfText).toContain("No open questions or follow-up items recorded.");
  });

  // 2. Long reports and multipage pagination
  it("handles long reports with multi-page automatic pagination and running headers/footers", () => {
    const manyTasks: ActionItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: `task-${i + 1}`,
      title: `Action Item ${i + 1} - Complete community mobilization and partner outreach deliverable`,
      description: `Detailed context description for milestone item ${i + 1}`,
      assignees: [`Person ${i + 1}`],
      deadline: {
        originalText: "next week",
        date: "2026-11-01",
        time: "17:00",
        timezone: "Asia/Manila",
        relation: "by" as const,
        isAmbiguous: false,
      },
      commitmentStatus: "confirmed" as const,
      priority: (i % 2 === 0 ? "high" : "medium") as any,
      status: (i % 3 === 0 ? "completed" : i % 3 === 1 ? "in_progress" : "todo") as any,
      evidence: [
        {
          quote: `Evidence citation quotation for task item ${i + 1}`,
          startOffset: 0,
          endOffset: 20,
          isVerified: true,
          provenance: "exact_match" as const,
        },
      ],
      missingInformation: [],
      needsReview: false,
      reviewStatus: "approved" as const,
    }));

    const meeting = createBaseMeeting({ actionItems: manyTasks });
    const doc = generateMeetingPdf(meeting);

    const totalPages = doc.getNumberOfPages();
    expect(totalPages).toBeGreaterThan(1);

    const pdfText = getPdfRawText(doc);
    // Verifies running footer has total pages
    expect(pdfText).toContain(`Page 1 of ${totalPages}`);
    expect(pdfText).toContain(`Page ${totalPages} of ${totalPages}`);
    // Verifies first and last task titles are rendered
    expect(pdfText).toContain("Action Item 1");
    expect(pdfText).toContain("Action Item 30");
  });

  // 3. Layout and page-break robustness with large summaries
  it("paginates long executive summaries cleanly without overflow", () => {
    // 40 lines of summary
    const hugeSummary = Array.from(
      { length: 40 },
      (_, i) => `Paragraph ${i + 1}: Comprehensive project discussion examining operational timeline and resource needs.`
    ).join("\n\n");

    const meeting = createBaseMeeting({ summary: hugeSummary });
    const doc = generateMeetingPdf(meeting);

    expect(doc).toBeDefined();
    // Huge summary should naturally split across pages without throwing or overflowing
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    const pdfText = getPdfRawText(doc);
    expect(pdfText).toContain("Paragraph 1");
    expect(pdfText).toContain("Paragraph 40");
  });

  // 4. Missing fields (assignees, deadlines, commitment)
  it("displays 'Not assigned' and 'Not confirmed' rather than inventing data", () => {
    const missingFieldsMeeting = createBaseMeeting({
      actionItems: [
        {
          id: "missing-task-1",
          title: "Setup projector and audio system",
          description: null,
          assignees: [], // Missing assignees
          deadline: {
            originalText: null, // Missing deadline
            date: null,
            time: null,
            timezone: "Asia/Manila",
            relation: null,
            isAmbiguous: false,
          },
          commitmentStatus: "proposed", // Tentative proposal
          priority: null,
          status: "todo",
          evidence: [],
          missingInformation: [],
          needsReview: false,
          reviewStatus: "approved",
        },
        {
          id: "missing-task-2",
          title: "Buy drinks and snacks",
          description: null,
          assignees: [],
          deadline: {
            originalText: "sometime soon",
            date: null,
            time: null,
            timezone: "Asia/Manila",
            relation: null,
            isAmbiguous: true,
          },
          commitmentStatus: "unclear",
          priority: null,
          status: "todo",
          evidence: [],
          missingInformation: [],
          needsReview: false,
          reviewStatus: "approved",
        },
      ],
    });

    const doc = generateMeetingPdf(missingFieldsMeeting);
    const pdfText = getPdfRawText(doc);

    // Verify "Not assigned" is displayed rather than inventing an assignee
    expect(pdfText).toContain("Not assigned");
    // Verify missing / ambiguous deadline is properly indicated
    expect(pdfText).toContain("Not specified");
    expect(pdfText).toContain("sometime soon");
    // Verify attention / clarification section flags the missing items
    expect(pdfText).toContain("Missing owner");
    expect(pdfText).toContain("Not confirmed");
  });

  // 5. Preserves formula-like characters in evidence quotes (Issue 1)
  it("preserves formula prefixes (=, +, @, -) in PDF text without stripping evidence quotes", () => {
    const formulaMeeting = createBaseMeeting({
      actionItems: [
        {
          id: "quote-task-1",
          title: "=SUM(A1:A10) Report Header",
          description: "@lead reviewer note",
          assignees: ["+639171234567"],
          deadline: {
            originalText: "-1 day",
            date: "2026-10-24",
            time: null,
            timezone: "Asia/Manila",
            relation: "by",
            isAmbiguous: false,
          },
          commitmentStatus: "confirmed",
          priority: "high",
          status: "todo",
          evidence: [
            {
              quote: "=cmd|' /C calc'!A0 was discussed as a security test vector.",
              startOffset: 0,
              endOffset: 55,
              isVerified: true,
              provenance: "exact_match",
            },
          ],
          missingInformation: [],
          needsReview: false,
          reviewStatus: "approved",
        },
      ],
    });

    const doc = generateMeetingPdf(formulaMeeting);
    const pdfText = getPdfRawText(doc);

    // Verify sanitizePdfText directly preserves prefixes
    expect(sanitizePdfText("=SUM(A1:A10) Report Header")).toBe("=SUM(A1:A10) Report Header");
    expect(sanitizePdfText("@lead reviewer note")).toBe("@lead reviewer note");
    expect(sanitizePdfText("+639171234567")).toBe("+639171234567");
    expect(sanitizePdfText("=cmd|' /C calc'!A0 was discussed")).toBe("=cmd|' /C calc'!A0 was discussed");

    // Prefix characters must NOT be stripped in PDF!
    expect(pdfText).toContain("=SUM");
    expect(pdfText).toContain("@lead reviewer note");
    expect(pdfText).toContain("+639171234567");
    expect(pdfText).toContain("=cmd|'");
    expect(pdfText).toContain("calc'!A0");
  });

  // 6. Multilingual font support without silent deletion (Issue 3)
  it("handles multilingual text and non-Latin characters visibly without silently deleting them", () => {
    const textWithSymbols = sanitizePdfText("Bayad: ₱1,500 para sa Piña ug Santo Niño. Check: ✓, Question: ❓");
    expect(textWithSymbols).toContain("PHP 1,500");
    expect(textWithSymbols).toContain("Piña");
    expect(textWithSymbols).toContain("Santo Niño");
    expect(textWithSymbols).toContain("[Done]");
    expect(textWithSymbols).toContain("[?]");

    // Test unsupported non-Latin Unicode characters (e.g. CJK, Cyrillic)
    // They must NOT be silently deleted or replaced with blank spaces!
    const textWithChinese = sanitizePdfText("Project Alpha: 世界 (World)");
    expect(textWithChinese).not.toContain("Project Alpha:   (World)"); // Must not be blank spaces
    expect(textWithChinese).toContain("[U+4E16]");
    expect(textWithChinese).toContain("[U+754C]");

    const textWithCyrillic = sanitizePdfText("Partner: Привет");
    expect(textWithCyrillic).toContain("[U+041F]");
    expect(textWithCyrillic).toContain("[U+0440]");
  });

  // 7. Status accuracy: never present draft/pending as human approved
  it("accurately distinguishes approved, pending-review, and rejected records", () => {
    const statusMeeting = createBaseMeeting({
      actionItems: [
        {
          id: "approved-task",
          title: "Approved Task Item",
          description: null,
          assignees: ["Mark"],
          deadline: {
            originalText: "ugma",
            date: "2026-10-24",
            time: null,
            timezone: "Asia/Manila",
            relation: "by",
            isAmbiguous: false,
          },
          commitmentStatus: "confirmed",
          priority: "high",
          status: "completed",
          evidence: [],
          missingInformation: [],
          needsReview: false,
          reviewStatus: "approved",
        },
        {
          id: "pending-task",
          title: "AI Draft Pending Review Item",
          description: null,
          assignees: ["Ana"],
          deadline: {
            originalText: "next week",
            date: "2026-10-31",
            time: null,
            timezone: "Asia/Manila",
            relation: "by",
            isAmbiguous: false,
          },
          commitmentStatus: "confirmed",
          priority: null,
          status: "todo",
          evidence: [],
          missingInformation: [],
          needsReview: true,
          reviewStatus: "pending",
        },
        {
          id: "rejected-task",
          title: "Discarded Idea That Should Not Export",
          description: null,
          assignees: [],
          deadline: {
            originalText: null,
            date: null,
            time: null,
            timezone: "Asia/Manila",
            relation: null,
            isAmbiguous: false,
          },
          commitmentStatus: "unclear",
          priority: null,
          status: "todo",
          evidence: [],
          missingInformation: [],
          needsReview: false,
          reviewStatus: "rejected",
        },
      ],
    });

    // Default export (includePending = false)
    const docDefault = generateMeetingPdf(statusMeeting, { includePending: false });
    const textDefault = getPdfRawText(docDefault);

    expect(textDefault).toContain("Approved Task Item");
    expect(textDefault).not.toContain("AI Draft Pending Review Item");
    expect(textDefault).not.toContain("Discarded Idea That Should Not Export");
    expect(textDefault).toContain("OFFICIAL ACTION REPORT");

    // With includePending = true
    const docWithPending = generateMeetingPdf(statusMeeting, { includePending: true });
    const textWithPending = getPdfRawText(docWithPending);

    expect(textWithPending).toContain("Approved Task Item");
    expect(textWithPending).toContain("AI Draft Pending Review Item");
    expect(textWithPending).not.toContain("Discarded Idea That Should Not Export");
    expect(textWithPending).toContain("DRAFT & PENDING REVIEW");
    expect(textWithPending).toContain("Pending Review");
  });

  // 8. Vector text searchability
  it("generates vector PDF where text is selectable and searchable", async () => {
    const meeting = createBaseMeeting();
    const blob = await exportMeetingToPdf(meeting);

    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe("application/pdf");

    const arrayBuffer = await blob.arrayBuffer();
    const str = Buffer.from(arrayBuffer).toString("latin1");

    expect(str).toContain("TAMBAYAYONG");
    expect(str).toContain("Community Outreach Strategy Session");
    expect(str).toContain("Coordinate with barangay officials for permit");
    expect(str).toContain("Purchase hygiene supplies and soap");
    expect(str).toContain("Set maximum budget to PHP 25,000");
    expect(str).toContain("How many transport vans will be required?");
  });

  // 9. API route validation, payload limit, and error privacy (Issue 2)
  describe("Export API Route Security & Validation", () => {
    it("rejects invalid export formats with 400 Bad Request", async () => {
      const meeting = createBaseMeeting();
      const req = new NextRequest("http://localhost:3000/api/meetings/101/export?format=exe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meeting),
      });

      const res = await exportHandler(req, { params: { id: "101" } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("Invalid export format");
    });

    it("rejects oversized payloads with 413 Payload Too Large", async () => {
      const hugeString = "a".repeat(6 * 1024 * 1024); // 6MB
      const req = new NextRequest("http://localhost:3000/api/meetings/101/export?format=pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(6 * 1024 * 1024),
        },
        body: hugeString,
      });

      const res = await exportHandler(req, { params: { id: "101" } });
      expect(res.status).toBe(413);

      const json = await res.json();
      expect(json.error).toContain("Payload too large");
    });

    it("rejects malformed JSON with 400 Bad Request without leaking internal details", async () => {
      const req = new NextRequest("http://localhost:3000/api/meetings/101/export?format=pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "NOT_VALID_JSON{",
      });

      const res = await exportHandler(req, { params: { id: "101" } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("Malformed JSON payload");
      expect(json.details).toBeUndefined(); // Must not expose details/stack
    });

    it("rejects invalid meeting structures with 400 Bad Request", async () => {
      const invalidMeeting = { randomField: 123 };
      const req = new NextRequest("http://localhost:3000/api/meetings/101/export?format=pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidMeeting),
      });

      const res = await exportHandler(req, { params: { id: "101" } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("Invalid meeting data structure");
    });
  });
});
