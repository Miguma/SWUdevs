export interface ProcessedTranscript {
  normalizedText: string;
  characterCount: number;
  lineCount: number;
  wordCount: number;
}

export function preprocessTranscriptText(rawInput: string): ProcessedTranscript {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      normalizedText: "",
      characterCount: 0,
      lineCount: 0,
      wordCount: 0,
    };
  }

  // Normalize Windows CRLF and classic Mac CR to standard LF
  let normalized = rawInput.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Strip null bytes and non-printable control characters (except tabs and newlines)
  normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Trim leading/trailing blank lines
  normalized = normalized.trim();

  const lines = normalized.split("\n");
  const words = normalized.split(/\s+/).filter(Boolean);

  return {
    normalizedText: normalized,
    characterCount: normalized.length,
    lineCount: lines.length,
    wordCount: words.length,
  };
}

export function parseUploadedFileContent(
  filename: string,
  content: string
): { success: boolean; text?: string; error?: string } {
  if (!content || content.trim() === "") {
    return { success: false, error: "The uploaded file is empty." };
  }

  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "txt" || ext === "md") {
    const processed = preprocessTranscriptText(content);
    return { success: true, text: processed.normalizedText };
  }

  if (ext === "csv") {
    try {
      const extractedText = parseCsvTranscript(content);
      if (!extractedText || extractedText.trim() === "") {
        return {
          success: false,
          error: "Could not find a transcript column in the uploaded CSV. Ensure a column has text content.",
        };
      }
      return { success: true, text: extractedText };
    } catch (e: any) {
      return { success: false, error: `Failed to parse CSV: ${e.message}` };
    }
  }

  return {
    success: false,
    error: `Unsupported file format (.${ext}). Tambayayong currently supports .txt, .md, .csv, and .pdf transcripts.`,
  };
}

export async function parseUploadedPdfBuffer(
  buffer: Buffer | Uint8Array
): Promise<{ success: boolean; text?: string; error?: string }> {
  if (!buffer || buffer.length === 0) {
    return { success: false, error: "The uploaded PDF file is empty." };
  }

  try {
    const { extractText } = await import("unpdf");
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const result = await extractText(uint8);
    const rawText = Array.isArray(result.text)
      ? result.text.join("\n\n")
      : typeof result.text === "string"
      ? result.text
      : "";

    const trimmed = rawText.trim();
    if (!trimmed) {
      return {
        success: false,
        error: "The uploaded PDF does not contain selectable text (it may be a scanned image).",
      };
    }
    const processed = preprocessTranscriptText(trimmed);
    return { success: true, text: processed.normalizedText };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to extract text from PDF: ${err.message || "Unknown error"}`,
    };
  }
}

export function parseCsvTranscript(csvContent: string): string {
  const lines = csvContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) return "";

  // Parse header
  const headerCols = splitCsvLine(lines[0]).map((c) => c.toLowerCase().trim().replace(/^["']|["']$/g, ""));

  // Check for common column names: speaker, message, transcript, text, content, utterance, notes
  const targetKeywords = ["text", "transcript", "message", "content", "utterance", "notes", "dialogue", "speech"];
  let targetColIndex = -1;

  for (let i = 0; i < headerCols.length; i++) {
    if (targetKeywords.some((kw) => headerCols[i].includes(kw))) {
      targetColIndex = i;
      break;
    }
  }

  // Check for speaker column
  let speakerColIndex = -1;
  const speakerKeywords = ["speaker", "person", "name", "who", "user", "participant"];
  for (let i = 0; i < headerCols.length; i++) {
    if (speakerKeywords.some((kw) => headerCols[i].includes(kw))) {
      speakerColIndex = i;
      break;
    }
  }

  // If no matching column name in header, default to column 1 if >=2 cols, or col 0
  if (targetColIndex === -1) {
    targetColIndex = headerCols.length > 1 ? 1 : 0;
  }

  const resultRows: string[] = [];

  for (let r = 1; r < lines.length; r++) {
    const row = splitCsvLine(lines[r]);
    if (row.length <= targetColIndex) continue;

    const textVal = row[targetColIndex].trim().replace(/^["']|["']$/g, "").trim();
    if (!textVal) continue;

    if (speakerColIndex !== -1 && row.length > speakerColIndex) {
      const speakerVal = row[speakerColIndex].trim().replace(/^["']|["']$/g, "").trim();
      if (speakerVal) {
        resultRows.push(`${speakerVal}: ${textVal}`);
        continue;
      }
    }

    resultRows.push(textVal);
  }

  return resultRows.join("\n");
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}
