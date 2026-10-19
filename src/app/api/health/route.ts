import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    product: "Tambayayong",
    tagline: "From conversation to action. Walay mabilin!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
