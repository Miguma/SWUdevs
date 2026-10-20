import { describe, it, expect } from "vitest";
import {
  generateMeetingPdf,
  sanitizePdfText,
  exportMeetingToPdf,
} from "../src/lib/pdf-export";
import { MeetingExtraction, ActionItem } from "../src/types/meeting";

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
    // Generate 30 action items to force multiple A4 pages
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

  // 3. Missing fields (assignees, deadlines, commitment)
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

  // 4. Status accuracy: never present draft/pending as human approved
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

    // Case A: Default export (includePending = false)
    const docDefault = generateMeetingPdf(statusMeeting, { includePending: false });
    const textDefault = getPdfRawText(docDefault);

    expect(textDefault).toContain("Approved Task Item");
    expect(textDefault).not.toContain("AI Draft Pending Review Item");
    expect(textDefault).not.toContain("Discarded Idea That Should Not Export");
    expect(textDefault).toContain("OFFICIAL ACTION REPORT");

    // Case B: With includePending = true
    const docWithPending = generateMeetingPdf(statusMeeting, { includePending: true });
    const textWithPending = getPdfRawText(docWithPending);

    expect(textWithPending).toContain("Approved Task Item");
    expect(textWithPending).toContain("AI Draft Pending Review Item");
    // Rejected task must STILL NOT be included
    expect(textWithPending).not.toContain("Discarded Idea That Should Not Export");
    // Pending items must be clearly flagged as Draft
    expect(textWithPending).toContain("DRAFT & PENDING REVIEW");
    expect(textWithPending).toContain("Pending Review");
  });

  // 5. Multilingual characters: Cebuano, Tagalog, English, ñ/Ñ, Currency
  it("supports Unicode, mixed Cebuano/Tagalog content, and sanitizes untrusted input", () => {
    const multilingualMeeting = createBaseMeeting({
      title: "Sabot sa mga Buluhaton para sa Kapistahan ni Santo Niño",
      summary: "Nagkasinabot ang grupo nga si Mark magdala ug speaker ug si Ana sa pagkaon.",
      actionItems: [
        {
          id: "multi-task-1",
          title: "Mag-order ug Piña pie ug lechon manok",
          description: "Si Niño ug Peña ang mopalit sa merkado",
          assignees: ["Niño", "Peña"],
          deadline: {
            originalText: "ugma sa hapon",
            date: "2026-10-24",
            time: "15:00",
            timezone: "Asia/Manila",
            relation: "by",
            isAmbiguous: false,
          },
          commitmentStatus: "confirmed",
          priority: "high",
          status: "in_progress",
          evidence: [
            {
              quote: "“Si Niño ug Peña mopalit ug pagkaon nagkantidad ug ₱1,500.”",
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
        {
          id: "formula-task",
          title: "=cmd|' /C calc'!A0 Formula Attempt",
          description: "@dangerous text",
          assignees: ["+MaliciousUser"],
          deadline: {
            originalText: "bukas",
            date: "2026-10-24",
            time: null,
            timezone: "Asia/Manila",
            relation: "on",
            isAmbiguous: false,
          },
          commitmentStatus: "confirmed",
          priority: null,
          status: "todo",
          evidence: [],
          missingInformation: [],
          needsReview: false,
          reviewStatus: "approved",
        },
      ],
      decisions: [
        {
          id: "dec-ph",
          decision: "Ang bayad kay ₱500 matag usa — walay labot ang plete.",
          evidence: [],
          needsReview: false,
          reviewStatus: "approved",
        },
      ],
    });

    const doc = generateMeetingPdf(multilingualMeeting);
    const pdfText = getPdfRawText(doc);

    // Verify Cebuano / Tagalog title & words with ñ / Ñ
    expect(pdfText).toContain("Santo Niño");
    expect(pdfText).toContain("Piña pie");
    expect(pdfText).toContain("Peña");

    // Verify Currency sign is normalized to readable PHP
    expect(pdfText).toContain("PHP 1,500");
    expect(pdfText).toContain("PHP 500");

    // Verify formula characters are safely neutralized
    expect(pdfText).not.toContain("=cmd|");
    expect(pdfText).toContain("cmd|' /C calc'!A0 Formula Attempt");
  });

  // 6. Text is selectable and searchable
  it("generates vector PDF where text is selectable and searchable", async () => {
    const meeting = createBaseMeeting();
    const blob = await exportMeetingToPdf(meeting);

    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe("application/pdf");

    // Check array buffer directly
    const arrayBuffer = await blob.arrayBuffer();
    const str = Buffer.from(arrayBuffer).toString("latin1");

    // Header, meeting title, tasks, and provenance strings are directly in PDF text stream
    expect(str).toContain("TAMBAYAYONG");
    expect(str).toContain("Community Outreach Strategy Session");
    expect(str).toContain("Coordinate with barangay officials for permit");
    expect(str).toContain("Purchase hygiene supplies and soap");
    expect(str).toContain("Set maximum budget to PHP 25,000");
    expect(str).toContain("How many transport vans will be required?");
  });
});
