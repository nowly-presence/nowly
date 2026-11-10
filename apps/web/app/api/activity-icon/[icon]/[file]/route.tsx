import { ImageResponse } from "next/og";
import { ACTIVITY_ICON_GLYPH_RATIO, ACTIVITY_ICON_PATHS, isActivityIconColor, isActivityIconKey } from "@nowly/shared/activity-icons";

export const runtime = "nodejs";

const COLOR_FILE_PATTERN = /^([0-9a-f]{6})\.png$/;

const IMAGE_SIZE = 512;
const GLYPH_SIZE = Math.round(IMAGE_SIZE * ACTIVITY_ICON_GLYPH_RATIO);

const notFound = () => new Response(null, { status: 404 });

type RouteContext = {
  params: Promise<{
    icon: string;
    file: string;
  }>;
};

export const GET = async (_request: Request, { params }: RouteContext) => {
  const { icon, file } = await params;

  const colorMatch = COLOR_FILE_PATTERN.exec(file);
  const color = colorMatch?.[1];

  if (!isActivityIconKey(icon) || !color || !isActivityIconColor(`#${color}`)) {
    return notFound();
  }

  const response = new ImageResponse(
    <div
      style={{
        alignItems: "center",
        backgroundColor: `#${color}`,
        display: "flex",
        height: IMAGE_SIZE,
        justifyContent: "center",
        width: IMAGE_SIZE
      }}
    >
      <svg height={GLYPH_SIZE} viewBox="0 0 24 24" width={GLYPH_SIZE} xmlns="http://www.w3.org/2000/svg">
        <path d={ACTIVITY_ICON_PATHS[icon]} fill="#ffffff" />
      </svg>
    </div>,
    {
      height: IMAGE_SIZE,
      width: IMAGE_SIZE
    }
  );

  response.headers.set("Content-Type", "image/png");
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return response;
};