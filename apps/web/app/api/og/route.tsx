import { createOgImageResponse } from "@nowly/og/image-response";

export const runtime = "nodejs";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);

  return createOgImageResponse({
    title: searchParams.get("title") ?? undefined,
    description: searchParams.get("description") ?? undefined,
    badge: searchParams.get("badge") ?? undefined,
    accent: searchParams.get("accent") || undefined,
    logo: searchParams.get("logo") ?? undefined
  });
};