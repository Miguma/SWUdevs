import { NextResponse } from "next/server";
import { checkGroqHealth } from "@/server/services/groq-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkGroqHealth();
  return NextResponse.json(status, { status: status.modelAvailable ? 200 : 503 });
}
