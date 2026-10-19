import { NextResponse } from "next/server";
import appPackage from "../../../../package.json";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    product: "Tambayayong",
    tagline: "From conversation to action. Walay mabilin!",
    version: appPackage.version,
    release: "unified-ui-preview",
    accountAccess: "preview-only",
    timestamp: new Date().toISOString(),
  });
}
