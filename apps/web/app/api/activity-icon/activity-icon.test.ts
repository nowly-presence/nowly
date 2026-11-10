import { describe, expect, it } from "vitest";
import { GET } from "./[icon]/[file]/route";

const request = new Request("https://nowly.me/api/activity-icon/test/test.png?v=1");

const render = (icon: string, file: string) => GET(request, { params: Promise.resolve({ icon, file }) });

describe("activity icon route", () => {
  it.each([
    ["unknown icon", "unknown", "5a6bb0.png"],
    ["unknown color", "gamepad", "ffffff.png"],
    ["uppercase color", "gamepad", "5A6BB0.png"],
    ["hash color", "gamepad", "#5a6bb0.png"],
    ["wrong extension", "gamepad", "5a6bb0.svg"],
    ["missing extension", "gamepad", "5a6bb0"]
  ])("returns 404 for %s", async (_case, icon, file) => {
    const response = await render(icon, file);

    expect(response.status).toBe(404);
  });

  it("renders a valid PNG with immutable caching", async () => {
    const response = await render("gamepad", "5a6bb0.png");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
});