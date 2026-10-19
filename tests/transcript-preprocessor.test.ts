import { describe, it, expect } from "vitest";
import {
  preprocessTranscriptText,
  parseUploadedFileContent,
  parseCsvTranscript,
} from "../src/server/services/transcript-preprocessor";

describe("Transcript Preprocessor Service", () => {
  it("normalizes CRLF and counts characters and words", () => {
    const raw = "Line 1\r\nLine 2\r\nLine 3";
    const res = preprocessTranscriptText(raw);
    expect(res.normalizedText).toBe("Line 1\nLine 2\nLine 3");
    expect(res.lineCount).toBe(3);
    expect(res.wordCount).toBe(6);
  });

  it("parses text and markdown files directly", () => {
    const textRes = parseUploadedFileContent("meeting.txt", "Notes from the room");
    expect(textRes.success).toBe(true);
    expect(textRes.text).toBe("Notes from the room");

    const mdRes = parseUploadedFileContent("meeting.md", "## Header\n- Task item");
    expect(mdRes.success).toBe(true);
    expect(mdRes.text).toBe("## Header\n- Task item");
  });

  it("extracts speaker and message dialogue from CSV transcripts", () => {
    const csvContent = `Speaker,Message,Timestamp\nMaria,"Let's do the poster",14:00\nMark,"Ako na bahala ana",14:01`;
    const extracted = parseCsvTranscript(csvContent);
    expect(extracted).toContain("Maria: Let's do the poster");
    expect(extracted).toContain("Mark: Ako na bahala ana");
  });

  it("rejects unsupported extensions gracefully", () => {
    const res = parseUploadedFileContent("notes.exe", "binary");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Unsupported file format");
  });

  it("rejects empty file uploads", () => {
    const res = parseUploadedFileContent("empty.txt", "   \n  ");
    expect(res.success).toBe(false);
    expect(res.error).toContain("empty");
  });
});
