import { NextRequest, NextResponse } from "next/server";
import {
  parseUploadedPdfBuffer,
  parseUploadedFileContent,
} from "@/server/services/transcript-preprocessor";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB limit

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded. Please attach a transcript file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 15MB size limit. Please upload a smaller transcript." },
        { status: 413 }
      );
    }

    const filename = file.name || "transcript";
    const ext = filename.toLowerCase().split(".").pop();

    if (ext === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await parseUploadedPdfBuffer(buffer);

      if (!result.success) {
        console.error("[PDF Parse Error]:", result.error);
        return NextResponse.json(
          { error: result.error || "Failed to extract text from PDF." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        text: result.text,
        filename,
      });
    }

    if (ext === "txt" || ext === "md" || ext === "csv") {
      const textContent = await file.text();
      const result = parseUploadedFileContent(filename, textContent);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to parse file content." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        text: result.text,
        filename,
      });
    }

    return NextResponse.json(
      {
        error: `Unsupported file format (.${ext}). Tambayayong currently supports .txt, .md, .csv, and .pdf transcripts.`,
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("Transcript parsing error:", err);
    return NextResponse.json(
      { error: "Failed to process uploaded file." },
      { status: 500 }
    );
  }
}
