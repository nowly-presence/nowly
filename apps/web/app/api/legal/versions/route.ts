import { CURRENT_LEGAL_MANIFEST } from "@nowly/shared/legal";

export const GET = () =>
  Response.json(CURRENT_LEGAL_MANIFEST, {
    headers: {
      "Cache-Control": "public, max-age=300, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff"
    }
  });