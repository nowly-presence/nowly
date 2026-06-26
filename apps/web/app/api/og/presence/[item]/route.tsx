import { ASSET_URL } from "@/lib/assets";
import { API_BASE_URL } from "@/lib/constants";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import type { Presence } from "@/lib/data/presences";
import type { Metadata as PresenceMetadata } from "@nowly/sdk/metadata";
import { ImageResponse } from "next/og";

export const runtime = "edge";

type PresenceRelease = {
  slug: string
  version: string
  metadata: PresenceMetadata
  totalInstalls?: number
  activeUsers?: number
  addedAt?: string
  lastUpdated?: string
};

type Props = {
  params: Promise<{
    item: string
  }>
};

const fallbackOg = (name: string): ImageResponse =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 800,
        }}
      >
        {name}
      </div>
    ),
    { width: 1200, height: 630 }
  );

const getPeople = (presence: Presence) => {
  const seen = new Set<string>();

  const contributors = presence.contributors.filter((person) => {
    const key = (person.github ?? person.name).toLowerCase();

    if (
      key ===
      (presence.author.github ?? presence.author.name).toLowerCase()
    ) {
      return false;
    }

    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });

  return [presence.author, ...contributors];
};

const renderPresenceOg = (presence: Presence): ImageResponse => {
  const people = getPeople(presence);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 58,
          background: `radial-gradient(circle at 112% -18%, ${presence.iconColor}55 0, ${presence.iconColor}22 24%, transparent 58%), linear-gradient(135deg, #050505, #09090b 48%, #020617)`,
          color: "#ffffff",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <img alt="Nowly" src="https://cdn.nowly.me/assets/app_title.png" width={150} />
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 42 }}>
          <div
            style={{
              width: 190,
              height: 190,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 36,
              background: `${presence.iconColor}22`,
              boxShadow: `0 0 15px ${presence.iconColor}33`,
              flexShrink: 0,
            }}
          >
            <img src={ASSET_URL(presence.slug, "icon")} width={126} height={126} alt="" style={{ objectFit: "contain" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
            <div style={{ fontSize: 86, lineHeight: 0.95, fontWeight: 800, letterSpacing: 0 }}>
              {presence.name}
            </div>

            <div style={{ fontSize: 30, lineHeight: 1.35, color: "#a1a1aa", maxWidth: 760 }}>
              {presence.description}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#a1a1aa", fontSize: 22 }}>
              <span>Presence by</span>
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  width: Math.max(45, 45 + (people.slice(0, 5).length - 1) * 25),
                  height: 45,
                }}
              >
                {[...people.slice(0, 5)].reverse().map((person, reverseIndex) => {
                  const index = people.slice(0, 5).length - 1 - reverseIndex;

                  return (
                    <img
                      key={`${person.name}-${index}`}
                      src={
                        person.github
                          ? `https://github.com/${person.github}.png?size=92`
                          : "https://cdn.nowly.me/assets/app_icon.png"}
                      width={45}
                      height={45}
                      alt=""
                      style={{
                        position: "absolute",
                        left: index * 25,
                        top: 0,
                        borderRadius: 999,
                        border: "2px solid #050505",
                      }}
                    />
                  );
                })}
              </div>

              <span style={{ color: "#ffffff", fontWeight: 650 }}>
                {people.map((person) => person.name).join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
};

export const GET = async (_request: Request, { params }: Props) => {
  const { item: raw } = await params;
  const item = raw.toLowerCase();

  try {
    const res = await fetch(`${API_BASE_URL}/presences/${item}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return fallbackOg("Nowly Presence");

    const data = await res.json() as PresenceRelease;
    const presence = metadataToPlatform({
      ...data.metadata,
      totalInstalls: data.totalInstalls,
      activeUsers: data.activeUsers,
    });

    return renderPresenceOg(presence);
  } catch {
    return fallbackOg("Nowly Presence");
  }
};
