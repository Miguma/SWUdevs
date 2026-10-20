import { NextResponse } from "next/server";
import { checkAiHealth } from "@/server/services/ai-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkAiHealth();
  if ((!status.ollamaConnected || !status.availableModels.length) && !status.cloud.modelAvailable) {
    return NextResponse.json(status, { status: 503 });
  }
  return NextResponse.json(status, { status: 200 });
}
