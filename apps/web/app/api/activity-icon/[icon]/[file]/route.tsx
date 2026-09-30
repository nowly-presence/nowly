import { ImageResponse } from "next/og";

import {
  ACTIVITY_ICON_COLORS,
  ACTIVITY_ICON_KEYS,
  ACTIVITY_ICON_PATHS,
  type ActivityIconKey,
} from "../../activity-icons";

export const runtime = "nodejs";

const COLOR_FILE_PATTERN = /^([0-9a-f]{6})\.png$/;

const isActivityIconKey = (value: string): value is ActivityIconKey =>
  (ACTIVITY_ICON_KEYS as readonly string[]).includes(value);

const notFound = () => new Response(null, { status: 404 });

type RouteContext = {
  params: Promise<{ icon: string; file: string }>;
};

export const GET = async (_request: Request, { params }: RouteContext) => {
  const { icon, file } = await params;
  const colorMatch = COLOR_FILE_PATTERN.exec(file);
  const color = colorMatch?.[1];

  if (!isActivityIconKey(icon) || !color || !ACTIVITY_ICON_COLORS.includes(color as (typeof ACTIVITY_ICON_COLORS)[number])) {
    return notFound();
  }

  const response = new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          backgroundColor: `#${color}`,
          display: "flex",
          height: "512px",
          justifyContent: "center",
          width: "512px",
        }}
      >
        <svg height="236" viewBox="0 0 24 24" width="236" xmlns="http://www.w3.org/2000/svg">
          <path d={ACTIVITY_ICON_PATHS[icon]} fill="#ffffff" />
        </svg>
      </div>
    ),
    { height: 512, width: 512 },
  );

  response.headers.set("Content-Type", "image/png");
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return response;
};
