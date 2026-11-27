import { DESKTOP_LATEST_MANIFEST_URL } from "@/lib/constants";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PLATFORMS = ["windows", "macos", "linux"] as const;
const VIRUSTOTAL_REPORT_PREFIX = "https://www.virustotal.com/gui/file/";

type Manifest = {
  version?: unknown;
} & Partial<
  Record<
    (typeof PLATFORMS)[number],
    Record<
      string,
      {
        virustotalUrl?: unknown;
      }
    >
  >
>;

const virustotalReports = (manifest: Manifest) =>
  Object.fromEntries(
    PLATFORMS.flatMap((platform) => {
      const reports = Object.entries(manifest[platform] ?? {}).flatMap(([name, artifact]) => {
        const url = artifact?.virustotalUrl;
        return typeof url === "string" && url.startsWith(VIRUSTOTAL_REPORT_PREFIX) ? [[name, url]] : [];
      });
      return reports.length > 0
        ? [
            [
              platform,
              Object.fromEntries(reports)
            ]
          ]
        : [];
    })
  );

export const GET = async (): Promise<NextResponse> => {
  try {
    const response = await fetch(DESKTOP_LATEST_MANIFEST_URL, { cache: "no-store" });

    if (!response.ok) throw new Error(`manifest request failed: ${response.status}`);

    const manifest = (await response.json()) as Manifest;

    if (typeof manifest.version !== "string" || !manifest.version.trim()) {
      throw new Error("manifest version missing");
    }

    return NextResponse.json(
      {
        version: manifest.version,
        virustotal: virustotalReports(manifest)
      },
      {
        headers: { "Cache-Control": "no-store" }
      }
    );
  } catch {
    return NextResponse.json(
      { error: "DESKTOP_VERSION_UNAVAILABLE" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
};