import { describe, it, expect } from "vitest";
import {
  preprocessTranscriptText,
  parseUploadedFileContent,
  parseCsvTranscript,
  parseUploadedPdfBuffer,
} from "../src/server/services/transcript-preprocessor";
import { POST as parseRouteHandler } from "../src/app/api/transcript/parse/route";
import { jsPDF } from "jspdf";
import { NextRequest } from "next/server";

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

  // PDF Parsing Tests
  it("extracts selectable text from uploaded PDF buffer", async () => {
    const doc = new jsPDF();
    doc.text("Meeting transcript: Si Mark ug Ana magkuha ug permit sa barangay ugma.", 10, 10);
    const pdfBuf = Buffer.from(doc.output("arraybuffer"));

    const result = await parseUploadedPdfBuffer(pdfBuf);
    expect(result.success).toBe(true);
    expect(result.text).toContain("Meeting transcript:");
    expect(result.text).toContain("Si Mark ug Ana magkuha ug permit");
  });

  it("handles empty or corrupt PDF buffer cleanly", async () => {
    const emptyBuf = Buffer.alloc(0);
    const result = await parseUploadedPdfBuffer(emptyBuf);
    expect(result.success).toBe(false);
    expect(result.error).toContain("empty");

    const corruptBuf = Buffer.from("NOT_A_PDF_STREAM");
    const corruptResult = await parseUploadedPdfBuffer(corruptBuf);
    expect(corruptResult.success).toBe(false);
    expect(corruptResult.error).toBeDefined();
  });

  // API Route Tests for File Parsing
  describe("POST /api/transcript/parse", () => {
    it("successfully parses uploaded PDF file via FormData", async () => {
      const doc = new jsPDF();
      doc.text("Strategic alignment: Review Q4 goals and assign action owners.", 10, 10);
      const pdfBytes = doc.output("arraybuffer");
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

      const formData = new FormData();
      formData.append("file", pdfBlob, "quarterly-sync.pdf");

      const req = new NextRequest("http://localhost:3000/api/transcript/parse", {
        method: "POST",
        body: formData,
      });

      const res = await parseRouteHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.text).toContain("Strategic alignment:");
      expect(json.filename).toBe("quarterly-sync.pdf");
    });

    it("successfully parses uploaded text/markdown file via FormData", async () => {
      const textBlob = new Blob(["Ana: We need to finalize the catering\nMark: I will handle it"], {
        type: "text/plain",
      });

      const formData = new FormData();
      formData.append("file", textBlob, "meeting-notes.txt");

      const req = new NextRequest("http://localhost:3000/api/transcript/parse", {
        method: "POST",
        body: formData,
      });

      const res = await parseRouteHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.text).toContain("Ana: We need to finalize the catering");
    });

    it("rejects request without file attachment with 400 Bad Request", async () => {
      const formData = new FormData();
      const req = new NextRequest("http://localhost:3000/api/transcript/parse", {
        method: "POST",
        body: formData,
      });

      const res = await parseRouteHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("No file uploaded");
    });
  });
});
