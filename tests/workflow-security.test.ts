import { describe, it, expect } from "vitest";
import { sanitizeCsvField, generateCsvExport, generateMarkdownExport } from "../src/server/services/export-service";
import { verifyEvidenceQuote, createManualEvidence } from "../src/server/services/evidence-verifier";
import { MeetingIntakeSchema, MeetingExtraction, ActionItem } from "../src/types/meeting";

describe("Workflow Security & Formula Injection Defense", () => {
  it("neutralizes dangerous spreadsheet formula prefixes", () => {
    expect(sanitizeCsvField("  =SUM(A1:A10)")).toBe(`"'  =SUM(A1:A10)"`);
    // Formula prefixes: '=', '+', '-', '@', '\t', '\r'
    expect(sanitizeCsvField("=SUM(A1:A10)")).toBe(`"'=SUM(A1:A10)"`);
    expect(sanitizeCsvField("+1234567890")).toBe(`"'+1234567890"`);
    expect(sanitizeCsvField("-cmd|' /C calc'!A0")).toBe(`"'-cmd|' /C calc'!A0"`);
    expect(sanitizeCsvField("@SUM(1+1)")).toBe(`"'@SUM(1+1)"`);
    expect(sanitizeCsvField("\tTabPrefix")).toBe(`"'\tTabPrefix"`);
    expect(sanitizeCsvField("\rCarriagePrefix")).toBe(`"'\rCarriagePrefix"`);
  });

  it("does not alter legitimate internal symbols like email or equations in prose", () => {
    expect(sanitizeCsvField("user@example.com")).toBe(`"user@example.com"`);
    expect(sanitizeCsvField("Result is 1 + 2 = 3")).toBe(`"Result is 1 + 2 = 3"`);
    expect(sanitizeCsvField("Item: A - B")).toBe(`"Item: A - B"`);
  });

  it("escapes internal quotes correctly in CSV fields", () => {
    expect(sanitizeCsvField('She said "hello" to him')).toBe(`"She said ""hello"" to him"`);
  });
});

describe("Evidence Provenance & Verification Integrity", () => {
  const transcript = "Meeting notes: Carlo will finalize the poster by Friday afternoon. No physical hoodies.";
  it("uses offsets in the original string despite Unicode case expansion before the quote", () => {
    const source = "İ: CARLO will finalize the poster.";
    const result = verifyEvidenceQuote(source, "carlo will finalize the poster");
    const evidence = result.verifiedEvidence[0];
    expect(source.slice(evidence.startOffset!, evidence.endOffset!)).toBe(evidence.quote);
    expect(evidence.startOffset).toBe(3);
  });

  it("classifies exact transcript matches as 'exact_match'", () => {
    const res = verifyEvidenceQuote(transcript, "Carlo will finalize the poster");
    expect(res.isVerified).toBe(true);
    expect(res.provenance).toBe("exact_match");
    expect(res.verifiedEvidence[0].startOffset).toBeGreaterThanOrEqual(0);
  });

  it("classifies case/whitespace differences as 'normalized_match'", () => {
    const res = verifyEvidenceQuote(transcript, "carlo will finalize the poster");
    expect(res.isVerified).toBe(true);
    expect(res.provenance).toBe("normalized_match");
  });

  it("classifies missing quotes as 'unverified'", () => {
    const res = verifyEvidenceQuote(transcript, "Maria will purchase 50 hoodies");
    expect(res.isVerified).toBe(false);
    expect(res.provenance).toBe("unverified");
    expect(res.verifiedEvidence[0].startOffset).toBeNull();
  });

  it("identifies user manual items as 'manual' and never as verified quotes", () => {
    const manualEv = createManualEvidence("Manually added during committee sync");
    expect(manualEv.isVerified).toBe(false);
    expect(manualEv.provenance).toBe("manual");
    expect(manualEv.quote).toBe("Manually added during committee sync");
  });
});

describe("Meeting Intake Schema Validation", () => {
  it("rejects empty titles and short transcripts", () => {
    const invalidResult = MeetingIntakeSchema.safeParse({
      title: "",
      rawText: "Short",
    });
    expect(invalidResult.success).toBe(false);
  });

  it("accepts valid meeting metadata with Asia/Manila default timezone", () => {
    const validResult = MeetingIntakeSchema.safeParse({
      title: "Logistics Sync",
      rawText: "Detailed notes with more than ten characters.",
    });
    expect(validResult.success).toBe(true);
    if (validResult.success) {
      expect(validResult.data.timezone).toBe("Asia/Manila");
    }
  });
});
