import { adsensePublisherId } from "@/features/ads/lib/adsense";
import { NextResponse } from "next/server";

// Google's AdSense certification authority ID, the same for every publisher.
const GOOGLE_TAG_ID = "f08c47fec0942fa0";

export const GET = () => {
  const publisher = adsensePublisherId();
  if (!publisher) return new NextResponse("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  return new NextResponse(`google.com, ${publisher}, DIRECT, ${GOOGLE_TAG_ID}\n`, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
