import { presenceApiBaseUrl, PRODUCTION_API_URL } from "@/lib/presence-api";

type RouteContext = {
  params: Promise<{ slug: string }>
};

const fetchRelease = async (baseUrl: string, slug: string): Promise<unknown | null> => {
  try {
    const response = await fetch(
      `${baseUrl}/presences/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

export const GET = async (_request: Request, { params }: RouteContext) => {
  const { slug } = await params;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return Response.json({ error: "MISSING_SLUG" }, { status: 400 });
  }

  const bases = [...new Set([PRODUCTION_API_URL, presenceApiBaseUrl()])];
  for (const base of bases) {
    const release = await fetchRelease(base, normalized);
    if (release) return Response.json(release);
  }

  return Response.json({ error: "PRESENCE_NOT_FOUND" }, { status: 404 });
};
