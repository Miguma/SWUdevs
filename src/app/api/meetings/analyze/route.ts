import { NextRequest, NextResponse } from "next/server";
import { MeetingIntakeSchema } from "@/types/meeting";
import { executeOllamaExtraction } from "@/server/services/ollama-client";
import { preprocessTranscriptText } from "@/server/services/transcript-preprocessor";

export async function POST(req: NextRequest) {
  try {
    const jsonBody = await req.json();
    const parseResult = MeetingIntakeSchema.safeParse(jsonBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, organization, meetingDate, dateUnknown, timezone, participants, rawText } =
      parseResult.data;

    const preprocessed = preprocessTranscriptText(rawText);
    if (preprocessed.normalizedText.length < 10) {
      return NextResponse.json(
        { error: "Meeting notes are too short or contain only whitespace." },
        { status: 400 }
      );
    }

    const effectiveDate = dateUnknown ? undefined : meetingDate || undefined;

    const extraction = await executeOllamaExtraction({
      title,
      organization,
      meetingDate: effectiveDate,
      timezone,
      participants,
      rawText: preprocessed.normalizedText,
    });

    return NextResponse.json(extraction, { status: 200 });
  } catch (err: any) {
    console.error("Analysis route error:", err.message);

    // If local Ollama is down or model missing, return 503 with helpful guide
    if (
      err.message?.includes("Cannot connect to Ollama") ||
      err.message?.includes("timed out") ||
      err.message?.includes("ECONNREFUSED")
    ) {
      return NextResponse.json(
        {
          error: "Ollama inference service is currently unreachable.",
          message:
            "Please make sure Ollama is running locally (`ollama serve`) and the model is downloaded (`ollama pull qwen3:4b-instruct` or `ollama pull qwen2.5:3b`).",
          details: err.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to extract meeting action items.",
        message: err.message || "An unexpected error occurred during processing.",
      },
      { status: 500 }
    );
  }
}
