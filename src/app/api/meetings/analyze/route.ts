import { NextRequest, NextResponse } from "next/server";
import { MeetingIntakeSchema } from "@/types/meeting";
import { executeOllamaExtraction } from "@/server/services/ollama-client";
import { preprocessTranscriptText } from "@/server/services/transcript-preprocessor";

export const dynamic = "force-dynamic";

// Sliding window rate limiter for expensive AI extraction endpoint
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(clientIp);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  bucket.count++;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Client IP rate limiting
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded.",
          message:
            "Too many extraction requests in a short time. Please wait one minute before analyzing again.",
        },
        { status: 429 }
      );
    }

    // 2. Request body size check (prevent memory exhaustion attacks)
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload too large. Maximum request size is 1MB." },
        { status: 413 }
      );
    }

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
    // Clean and sanitize error message to never leak internal server topology
    const rawMsg = err.message || "";
    const isOllamaOffline =
      rawMsg.includes("Cannot connect") ||
      rawMsg.includes("timed out") ||
      rawMsg.includes("ECONNREFUSED") ||
      rawMsg.includes("Ollama");

    if (isOllamaOffline) {
      return NextResponse.json(
        {
          error: "Local AI inference service is currently offline or unreachable.",
          message:
            "Please ensure Ollama is running (`ollama serve`) and the configured model is installed (`ollama pull qwen3:4b-instruct`).",
        },
        { status: 503 }
      );
    }

    if (rawMsg.includes("busy processing other requests")) {
      return NextResponse.json(
        {
          error: "Inference engine busy",
          message: rawMsg,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to extract meeting action items.",
        message: rawMsg.includes("parse")
          ? "The AI model returned an unparseable response. Please retry with clearer notes."
          : "An unexpected error occurred during transcript extraction.",
      },
      { status: 500 }
    );
  }
}
