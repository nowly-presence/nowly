import { describe, expect, it } from "vitest";
import messages from "@nowly/locales/messages/web/en-US.json";
import { GET } from "@/app/api/legal/versions/route";

describe("public legal dates", () => {
  it("reads dates directly from the published documents without a separate manifest", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      tos: messages["tos-page"]["last-updated"],
      privacy: messages["privacy-page"]["last-updated"]
    });
  });

  it("uses a short public cache and allows credential-free extension requests", () => {
    const response = GET();
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300, must-revalidate");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.has("Set-Cookie")).toBe(false);
    expect(response.headers.has("Access-Control-Allow-Credentials")).toBe(false);
  });
});