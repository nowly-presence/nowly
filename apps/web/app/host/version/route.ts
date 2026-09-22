import { DESKTOP_LATEST_MANIFEST_URL } from "@/lib/constants";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Manifest = { version?: unknown };

export const GET = async (): Promise<NextResponse> => {
  try {
    const response = await fetch(DESKTOP_LATEST_MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`manifest request failed: ${response.status}`);

    const manifest = (await response.json()) as Manifest;
    if (typeof manifest.version !== "string" || !manifest.version.trim()) {
      throw new Error("manifest version missing");
    }

    return NextResponse.json(
      { version: manifest.version },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "DESKTOP_VERSION_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
};
