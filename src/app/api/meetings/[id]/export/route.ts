import { NextRequest, NextResponse } from "next/server";
import {
  generateMarkdownExport,
  generateCsvExport,
  generateMeetingMinutesExport,
} from "@/server/services/export-service";
import { MeetingExtraction } from "@/types/meeting";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "md";
    const includePending = url.searchParams.get("includePending") === "true";

    const meetingData: MeetingExtraction = await req.json();

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
      const minutesContent = generateMeetingMinutesExport(meetingData, { includePending });
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
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate export", details: err.message },
      { status: 500 }
    );
  }
}
