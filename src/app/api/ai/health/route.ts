import { NextResponse } from "next/server";
import { checkOllamaHealth } from "@/server/services/ollama-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkOllamaHealth();
  if (!status.ollamaConnected) {
    return NextResponse.json(status, { status: 503 });
  }
  return NextResponse.json(status, { status: 200 });
}
