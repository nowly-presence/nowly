import { describe, expect, it } from "vitest";
import { CURRENT_LEGAL_MANIFEST, parseLegalManifest } from "@nowly/shared/legal";
import { GET } from "./route";

describe("public legal manifest", () => {
  it("exposes the shared document versions without authentication", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    const manifest = await response.json();
    expect(parseLegalManifest(manifest)).toEqual(CURRENT_LEGAL_MANIFEST);
    expect(Object.keys(manifest.documents)).toEqual(["tos", "privacy"]);
  });

  it("uses a short public cache and allows credential-free extension requests", () => {
    const response = GET();
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300, must-revalidate");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.has("Set-Cookie")).toBe(false);
    expect(response.headers.has("Access-Control-Allow-Credentials")).toBe(false);
  });
});