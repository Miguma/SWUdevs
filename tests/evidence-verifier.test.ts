import { describe, it, expect } from "vitest";
import {
  verifyEvidenceQuote,
  createManualEvidence,
} from "../src/server/services/evidence-verifier";

describe("Evidence Verifier Service & Provenance", () => {
  const sampleTranscript =
    "Meeting starts at 2pm. Si Mark na lang diay mag-design sa poster kay busy si Ana. Dili na ta mag-order ug shirts kay kuwang ang budget. Wala pa tay assigned sa sponsors.";

  it("finds exact verbatim quote and assigns 'exact_match' provenance", () => {
    const quote = "Si Mark na lang diay mag-design sa poster";
    const result = verifyEvidenceQuote(sampleTranscript, quote);

    expect(result.isVerified).toBe(true);
    expect(result.provenance).toBe("exact_match");
    expect(result.verifiedEvidence[0].provenance).toBe("exact_match");
    expect(result.verifiedEvidence[0].startOffset).toBe(
      sampleTranscript.indexOf(quote)
    );
    expect(result.verifiedEvidence[0].endOffset).toBe(
      sampleTranscript.indexOf(quote) + quote.length
    );
  });

  it("handles whitespace variations and assigns 'normalized_match' provenance", () => {
    const rawWithNewlines = "Dili na ta\n   mag-order ug shirts";
    const quote = "Dili na ta mag-order ug shirts";
    const result = verifyEvidenceQuote(rawWithNewlines, quote);

    expect(result.isVerified).toBe(true);
    expect(result.provenance).toBe("normalized_match");
    expect(result.verifiedEvidence[0].provenance).toBe("normalized_match");
    expect(result.verifiedEvidence[0].startOffset).toBe(0);
  });

  it("flags fabricated or altered quotes as 'unverified'", () => {
    const fabricatedQuote = "Mark will definitely finish the poster by tomorrow";
    const result = verifyEvidenceQuote(sampleTranscript, fabricatedQuote);

    expect(result.isVerified).toBe(false);
    expect(result.provenance).toBe("unverified");
    expect(result.verifiedEvidence[0].provenance).toBe("unverified");
    expect(result.verifiedEvidence[0].startOffset).toBeNull();
    expect(result.verifiedEvidence[0].endOffset).toBeNull();
  });

  it("handles empty quote safely", () => {
    const result = verifyEvidenceQuote(sampleTranscript, "");
    expect(result.isVerified).toBe(false);
    expect(result.provenance).toBe("unverified");
  });

  it("assigns 'manual' provenance to user-created items", () => {
    const manualEv = createManualEvidence("Task created manually during review");
    expect(manualEv.isVerified).toBe(false);
    expect(manualEv.provenance).toBe("manual");
    expect(manualEv.startOffset).toBeNull();
    expect(manualEv.endOffset).toBeNull();
  });
});
