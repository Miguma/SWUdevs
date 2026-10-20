import { NextResponse } from "next/server";
import { checkHuggingFaceHealth } from "@/server/services/huggingface-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkHuggingFaceHealth();
  return NextResponse.json(status, { status: status.modelAvailable ? 200 : 503 });
}
