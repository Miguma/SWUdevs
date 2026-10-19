import { describe, it, expect } from "vitest";
import {
  generateMarkdownExport,
  generateCsvExport,
  sanitizeCsvField,
} from "../src/server/services/export-service";
import { MeetingExtraction } from "../src/types/meeting";

describe("Export Service & Formula Injection Defense", () => {
  const mockMeeting: MeetingExtraction = {
    id: "test-meeting-1",
    title: "Community Outreach Planning",
    organization: "SWUdevs",
    meetingDate: "2026-10-23",
    timezone: "Asia/Manila",
    rawTranscript: "Mock transcript notes...",
    summary: "Discussion on community drive.",
    actionItems: [
      {
        id: "task-1",
        title: "Buy hygiene supplies",
        description: "Need soap and shampoo",
        assignees: ["Maria"],
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
        evidence: [{ quote: "Maria will buy soap", startOffset: 0, endOffset: 19, isVerified: true }],
        missingInformation: [],
        needsReview: false,
        reviewStatus: "approved",
      },
      {
        id: "task-2",
        title: "=cmd|' /C calc'!A0", // Formula injection attempt!
        description: "@danger formula",
        assignees: ["+MaliciousUser"],
        deadline: {
          originalText: null,
          date: null,
          time: null,
          timezone: "Asia/Manila",
          relation: null,
          isAmbiguous: false,
        },
        commitmentStatus: "confirmed",
        priority: null,
        evidence: [],
        missingInformation: [],
        needsReview: false,
        reviewStatus: "approved",
      },
      {
        id: "task-3",
        title: "Rejected idea to print posters",
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
        commitmentStatus: "confirmed",
        priority: null,
        evidence: [],
        missingInformation: [],
        needsReview: false,
        reviewStatus: "rejected", // Should NOT be exported
      },
    ],
    decisions: [
      {
        id: "dec-1",
        decision: "Volunteers meet at 8am Saturday",
        evidence: [],
        needsReview: false,
        reviewStatus: "approved",
      },
    ],
    openQuestions: [
      {
        id: "q-1",
        question: "How many vans are needed?",
        evidence: [],
        needsReview: false,
        reviewStatus: "approved",
      },
    ],
    nextMeeting: null,
    warnings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("generates markdown with checkboxes and excludes rejected items", () => {
    const md = generateMarkdownExport(mockMeeting);
    expect(md).toContain("# Community Outreach Planning");
    expect(md).toContain("- [ ] **Buy hygiene supplies**");
    expect(md).toContain("Maria");
    expect(md).toContain("2026-10-24");
    expect(md).toContain("Volunteers meet at 8am Saturday");
    // Rejected task must NOT appear in approved export
    expect(md).not.toContain("Rejected idea to print posters");
  });

  it("neutralizes formula injection in CSV exports", () => {
    const csv = generateCsvExport(mockMeeting);
    // '=' must be prefixed with single quote
    expect(csv).toContain("\"'=cmd|' /C calc'!A0\"");
    // '@' must be prefixed with single quote
    expect(csv).toContain("\"'@danger formula\"");
    // '+' must be prefixed with single quote
    expect(csv).toContain("\"'+MaliciousUser\"");
    // Rejected task must NOT appear
    expect(csv).not.toContain("Rejected idea to print posters");
  });

  it("sanitizes field prefix with single quote for formula triggers", () => {
    expect(sanitizeCsvField("=SUM(A1:A10)")).toBe(`"'=SUM(A1:A10)"`);
    expect(sanitizeCsvField("+12345")).toBe(`"'+12345"`);
    expect(sanitizeCsvField("-500")).toBe(`"'-500"`);
    expect(sanitizeCsvField("@mention")).toBe(`"'@mention"`);
    expect(sanitizeCsvField("Normal Text")).toBe(`"Normal Text"`);
  });
});
