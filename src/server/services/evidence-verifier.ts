import { Evidence } from "@/types/meeting";

export interface VerificationResult {
  verifiedEvidence: Evidence[];
  isVerified: boolean;
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
        },
      ],
      isVerified: false,
    };
  }

  const trimmedQuote = quote.trim();

  // Tier 1: Verbatim Exact Substring Search
  const exactIndex = rawTranscript.indexOf(trimmedQuote);
  if (exactIndex !== -1) {
    return {
      verifiedEvidence: [
        {
          quote: trimmedQuote,
          startOffset: exactIndex,
          endOffset: exactIndex + trimmedQuote.length,
          isVerified: true,
        },
      ],
      isVerified: true,
    };
  }

  // Tier 2: Case-Insensitive Search
  const lowerTranscript = rawTranscript.toLowerCase();
  const lowerQuote = trimmedQuote.toLowerCase();
  const caseInsensitiveIndex = lowerTranscript.indexOf(lowerQuote);
  if (caseInsensitiveIndex !== -1) {
    const actualSubstr = rawTranscript.slice(
      caseInsensitiveIndex,
      caseInsensitiveIndex + trimmedQuote.length
    );
    return {
      verifiedEvidence: [
        {
          quote: actualSubstr,
          startOffset: caseInsensitiveIndex,
          endOffset: caseInsensitiveIndex + trimmedQuote.length,
          isVerified: true,
        },
      ],
      isVerified: true,
    };
  }

  // Tier 3: Whitespace-Normalized Search
  // (e.g. handle differences in line breaks or multiple spaces)
  const normalizedMatch = findNormalizedMatch(rawTranscript, trimmedQuote);
  if (normalizedMatch) {
    return {
      verifiedEvidence: [
        {
          quote: normalizedMatch.matchedText,
          startOffset: normalizedMatch.startOffset,
          endOffset: normalizedMatch.endOffset,
          isVerified: true,
        },
      ],
      isVerified: true,
    };
  }

  // Tier 4: Verification Failed - Do NOT silently invent offsets
  return {
    verifiedEvidence: [
      {
        quote: trimmedQuote,
        startOffset: null,
        endOffset: null,
        isVerified: false,
      },
    ],
    isVerified: false,
  };
}

interface NormalizedMatch {
  matchedText: string;
  startOffset: number;
  endOffset: number;
}

function findNormalizedMatch(source: string, target: string): NormalizedMatch | null {
  // Collapse whitespace in target to single spaces
  const targetWords = target.split(/\s+/).filter(Boolean);
  if (targetWords.length === 0) return null;

  // Build regex pattern allowing flexible whitespace between tokens
  const escapedWords = targetWords.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = new RegExp(escapedWords.join("\\s+"), "i");
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
