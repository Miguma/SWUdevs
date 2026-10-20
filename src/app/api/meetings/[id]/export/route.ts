import { NextRequest, NextResponse } from "next/server";
import {
  generateMarkdownExport,
  generateCsvExport,
  generateMeetingMinutesExport,
} from "@/server/services/export-service";
import { MeetingExtraction } from "@/types/meeting";

export const dynamic = "force-dynamic";

// Maximum allowable JSON payload: 5MB
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_FORMATS = ["pdf", "csv", "minutes", "md"] as const;
type ExportFormat = (typeof ALLOWED_FORMATS)[number];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Enforce payload size limit via content-length header
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large. Maximum export payload size is 5MB." },
        { status: 413 }
      );
    }

    // 2. Validate URL format parameter
    const url = new URL(req.url);
    const rawFormat = (url.searchParams.get("format") || "md").toLowerCase();
    if (!ALLOWED_FORMATS.includes(rawFormat as ExportFormat)) {
      return NextResponse.json(
        {
          error: `Invalid export format "${rawFormat}". Supported formats: ${ALLOWED_FORMATS.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }
    const format = rawFormat as ExportFormat;
    const includePending = url.searchParams.get("includePending") === "true";

    // 3. Read body with length verification
    const bodyText = await req.text();
    if (bodyText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large. Maximum export payload size is 5MB." },
        { status: 413 }
      );
    }

    // 4. Validate JSON payload structure
    let meetingData: MeetingExtraction;
    try {
      meetingData = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    if (
      !meetingData ||
      typeof meetingData !== "object" ||
      typeof meetingData.title !== "string" ||
      !Array.isArray(meetingData.actionItems) ||
      !Array.isArray(meetingData.decisions) ||
      !Array.isArray(meetingData.openQuestions)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid meeting data structure. Required fields: title, actionItems, decisions, openQuestions.",
        },
        { status: 400 }
      );
    }

    const safeTitle = (meetingData.title || "meeting")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 40);
    const dateStr = meetingData.meetingDate || new Date().toISOString().slice(0, 10);

    if (format === "pdf") {
      const { generateMeetingPdf } = await import("@/lib/pdf-export");
      const doc = generateMeetingPdf(meetingData, { includePending });
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="tambayayong-${safeTitle}-${dateStr}.pdf"`,
        },
      });
    }

    if (format === "csv") {
      const csvContent = generateCsvExport(meetingData, { includePending });
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="tambayayong-${safeTitle}-${dateStr}.csv"`,
        },
      });
    }

    if (format === "minutes") {
      const minutesContent = generateMeetingMinutesExport(meetingData, {
        includePending,
      });
      return new NextResponse(minutesContent, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="tambayayong-${safeTitle}-${dateStr}-minutes.md"`,
        },
      });
    }

    // Default to markdown
    const mdContent = generateMarkdownExport(meetingData, { includePending });
    return new NextResponse(mdContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="tambayayong-${safeTitle}-${dateStr}.md"`,
      },
    });
  } catch (err: unknown) {
    // Log internally for debugging, but never expose internal errors/stacks to client
    console.error("Export request failed:", err);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}
