import { getDocOgMetadata } from "@/lib/docs/og-metadata";
import { ImageResponse } from "next/og";

type Props = {
  params: Promise<{
    slug?: string[]
  }>
};

export const runtime = "nodejs";

const loadInter = async (weight: 400 | 500): Promise<ArrayBuffer | null> => {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 86400 },
    }).then((res) => res.text());
    const fontUrl = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];

    if (!fontUrl) return null;

    return fetch(fontUrl, { next: { revalidate: 86400 } }).then((res) => res.arrayBuffer());
  } catch {
    return null;
  }
};

export const GET = async (req: Request, { params }: Props) => {
  const { slug } = await params;
  const pageSlug = slug?.join("/") || "getting-started/introduction";
  const docSlug = pageSlug.split("/").at(-1) ?? pageSlug;
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") || "dark") as "dark" | "light";
  const [fontMedium, fontRegular] = await Promise.all([loadInter(500), loadInter(400)]);
  const docMetadata = getDocOgMetadata(docSlug);

  const category = url.searchParams.get("category") ?? docMetadata?.category ?? "Documentation";
  const title = url.searchParams.get("title") ?? docMetadata?.title ?? "Nowly Documentation";
  const description = url.searchParams.get("description") ?? docMetadata?.description ?? "Learn how to install, configure and build Discord Rich Presence integrations with Nowly.";

  return new ImageResponse(
    (
      <div
        style={{
          background:
            mode === "dark"
              ? "linear-gradient(to top right, #000000 0%, #001419 40%, #22d3ee 100%)"
              : "linear-gradient(to top right, #fff 0%, #ecfeff 70%, #cffafe 100%)",
        }}
        tw={`relative flex h-full w-full flex-col p-20 ${mode === "dark" ? "text-white" : "text-black"}`}
      >
        <div tw="flex items-center">
          <img alt="Nowly" src="https://cdn.nowly.me/assets/app_title.png" width={150} />
        </div>

        <div
          style={{
            backgroundColor: "rgba(34, 211, 238, 0.15)",
            border: "1px solid rgba(34, 211, 238, 0.15)",
          }}
          tw={`mt-auto mr-auto rounded-full px-4 py-2 ${mode === "dark" ? "text-cyan-50" : "text-neutral-800"}`}
        >
          {category}
        </div>

        <h1 tw="text-7xl leading-[1.2] tracking-tighter max-w-3xl">
          {title}
        </h1>

        <p
          tw={`my-0 max-w-3xl text-3xl leading-relaxed tracking-tight ${
            mode === "dark" ? "text-neutral-400" : "text-[#083344]/55"
          }`}
        >
          {description}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        ...(fontMedium
          ? [{
              name: "Inter",
              data: fontMedium,
              style: "normal" as const,
              weight: 500 as const,
            }]
          : []),
        ...(fontRegular
          ? [{
              name: "Inter",
              data: fontRegular,
              style: "normal" as const,
              weight: 400 as const,
            }]
          : []),
      ],
    }
  );
};
