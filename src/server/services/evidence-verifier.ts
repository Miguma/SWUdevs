import { Evidence, EvidenceProvenance } from "@/types/meeting";

export interface VerificationResult {
  verifiedEvidence: Evidence[];
  isVerified: boolean;
  provenance: EvidenceProvenance;
  provenanceNote: string;
}

export function verifyEvidenceQuote(
  rawTranscript: string,
  quote: string | null | undefined
): VerificationResult {
  if (!quote || quote.trim() === "") {
    return {
      verifiedEvidence: [
        {
          quote: "",
          startOffset: null,
          endOffset: null,
          isVerified: false,
          provenance: "unverified",
          provenanceNote: "No citation quote provided.",
        },
      ],
      isVerified: false,
      provenance: "unverified",
      provenanceNote: "No citation quote provided.",
    };
  }

  const trimmedQuote = quote.trim();

  // Tier 1: Verbatim Exact Substring Search
  const exactIndex = rawTranscript.indexOf(trimmedQuote);
  if (exactIndex !== -1) {
    const ev: Evidence = {
      quote: trimmedQuote,
      startOffset: exactIndex,
      endOffset: exactIndex + trimmedQuote.length,
      isVerified: true,
      provenance: "exact_match",
      provenanceNote: "Exact verbatim citation found in source notes.",
    };
    return {
      verifiedEvidence: [ev],
      isVerified: true,
      provenance: "exact_match",
      provenanceNote: ev.provenanceNote || "",
    };
  }

  // Match against the original source so Unicode casing never shifts offsets.
  // Tier 3: Whitespace-Normalized Search
  const normalizedMatch = findNormalizedMatch(rawTranscript, trimmedQuote);
  if (normalizedMatch) {
    const ev: Evidence = {
      quote: normalizedMatch.matchedText,
      startOffset: normalizedMatch.startOffset,
      endOffset: normalizedMatch.endOffset,
      isVerified: true,
      provenance: "normalized_match",
      provenanceNote: "Citation found with whitespace normalization.",
    };
    return {
      verifiedEvidence: [ev],
      isVerified: true,
      provenance: "normalized_match",
      provenanceNote: ev.provenanceNote || "",
    };
  }

  // Tier 4: Verification Failed - Do NOT silently invent offsets
  const ev: Evidence = {
    quote: trimmedQuote,
    startOffset: null,
    endOffset: null,
    isVerified: false,
    provenance: "unverified",
    provenanceNote:
      "Quote could not be located in source notes. Requires human verification.",
  };
  return {
    verifiedEvidence: [ev],
    isVerified: false,
    provenance: "unverified",
    provenanceNote: ev.provenanceNote || "",
  };
}

export function createManualEvidence(description = "Manually created item"): Evidence {
  return {
    quote: description,
    startOffset: null,
    endOffset: null,
    isVerified: false,
    provenance: "manual",
    provenanceNote: "Manually added during user review (not an AI transcript quote).",
  };
}

interface NormalizedMatch {
  matchedText: string;
  startOffset: number;
  endOffset: number;
}

function findNormalizedMatch(source: string, target: string): NormalizedMatch | null {
  const cleanTarget = target.trim();
  if (!cleanTarget) return null;

  // Split into words, accommodating whitespace normalization
  const targetWords = cleanTarget.split(/\s+/).filter(Boolean);
  if (targetWords.length === 0) return null;

  // For each word, allow flexibility with surrounding quotation marks (straight or curly)
  // so PDF text, smart quotes, and unquoted model extracts locate exact source text
  const escapedWords = targetWords.map((w) => {
    const core = w.replace(/^["'“”‘’«»]+|["'“”‘’«»]+$/gu, "");
    const escapedCore = core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!escapedCore) {
      return `["'“”‘’«»]*`;
    }
    return `["'“”‘’«»]*${escapedCore}["'“”‘’«»]*`;
  });

  const pattern = new RegExp(escapedWords.join("\\s+"), "iu");
  const match = pattern.exec(source);

  if (match) {
    return {
      matchedText: match[0],
      startOffset: match.index,
      endOffset: match.index + match[0].length,
    };
  }

  return null;
}
