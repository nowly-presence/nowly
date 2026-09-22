import { BRAND_LOCKUP_WHITE_PNG } from "@/lib/brand";
import { SITE_NAME } from "@/lib/seo";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const ACCENT_DEFAULT = "#22d3ee";

// Mixes a hex color toward black so it stays safe as a full-bleed gradient stop
// (avoids relying on alpha, which satori composites over a white canvas by default).
const darken = (hex: string, amount: number): string => {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value) || normalized.length !== 6) return "#0d2229";

  const channel = (shift: number) => Math.round(((value >> shift) & 255) * (1 - amount));
  return `#${[channel(16), channel(8), channel(0)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

const loadSatoshi = async (weight: 500 | 700): Promise<ArrayBuffer | null> => {
  try {
    const css = await fetch(`https://api.fontshare.com/v2/css?f[]=satoshi@${weight}&display=swap`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
    }).then((res) => res.text());
    const fontUrl = css.match(/url\(['"]?(\/\/cdn\.fontshare\.com[^)'"]+\.ttf)['"]?\)/)?.[1];

    if (!fontUrl) return null;

    return fetch(`https:${fontUrl}`, { next: { revalidate: 86400 } }).then((res) => res.arrayBuffer());
  } catch {
    return null;
  }
};

const loadImageDataUri = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 NowlyOg/1.0" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/png";

    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
};

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") ?? SITE_NAME;
  const description = url.searchParams.get("description") ?? "";
  const badge = url.searchParams.get("badge");
  const accent = url.searchParams.get("accent") || ACCENT_DEFAULT;
  const accentMid = darken(accent, 0.8);
  const accentDark = darken(accent, 0.45);
  const logoParam = url.searchParams.get("logo");

  const [fontMedium, fontBold, lockup, presenceLogo] = await Promise.all([
    loadSatoshi(500),
    loadSatoshi(700),
    loadImageDataUri(BRAND_LOCKUP_WHITE_PNG),
    logoParam ? loadImageDataUri(logoParam) : Promise.resolve(null),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(120deg, #07080C 0%, #07080C 50%, ${accentMid} 75%, ${accentDark} 100%)`,
        }}
        tw="relative flex h-full w-full flex-col justify-between p-20 text-white"
      >
        <div tw="flex items-center">
          {lockup ? (
            <img alt={SITE_NAME} src={lockup} width={200} height={81} />
          ) : (
            <div tw="text-4xl font-bold tracking-tight">{SITE_NAME}</div>
          )}
        </div>

        <div tw="flex flex-col">
          {badge ? (
            <div tw="mb-8 flex items-center">
              {presenceLogo ? (
                <img alt="" src={presenceLogo} width={56} height={56} style={{ borderRadius: 14, marginRight: 20 }} />
              ) : null}
              <div
                style={{ backgroundColor: `${accent}26`, border: `1px solid ${accent}66`, color: accent }}
                tw="rounded-full px-4 py-2 text-2xl font-medium"
              >
                {badge}
              </div>
            </div>
          ) : null}

          <h1 tw="m-0 max-w-4xl text-7xl font-bold leading-[1.1] tracking-tight">
            {title}
          </h1>

          {description ? (
            <p tw="mt-6 max-w-3xl text-3xl leading-relaxed text-neutral-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
      fonts: [
        ...(fontMedium ? [{ name: "Satoshi", data: fontMedium, style: "normal" as const, weight: 500 as const }] : []),
        ...(fontBold ? [{ name: "Satoshi", data: fontBold, style: "normal" as const, weight: 700 as const }] : []),
      ],
    },
  );
};
