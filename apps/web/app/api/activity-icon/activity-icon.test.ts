import { describe, expect, it } from "vitest";

import { GET } from "./[icon]/[file]/route";
import { ACTIVITY_ICON_COLORS, ACTIVITY_ICON_KEYS, ACTIVITY_ICON_PATHS } from "./activity-icons";

const request = new Request("https://nowly.me/api/activity-icon/test/test.png?v=1");

const render = (icon: string, file: string) =>
  GET(request, { params: Promise.resolve({ icon, file }) });

describe("activity icon route", () => {
  it.each([
    ["unknown icon", "unknown", "5a6bb0.png"],
    ["unknown color", "gamepad", "ffffff.png"],
    ["uppercase color", "gamepad", "5A6BB0.png"],
    ["hash color", "gamepad", "#5a6bb0.png"],
    ["wrong extension", "gamepad", "5a6bb0.svg"],
    ["missing extension", "gamepad", "5a6bb0"],
  ])("returns 404 for %s", async (_case, icon, file) => {
    const response = await render(icon, file);

    expect(response.status).toBe(404);
  });

  it("renders a valid PNG with immutable caching", async () => {
    const response = await render("gamepad", "5a6bb0.png");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  it("keeps the path table aligned with the 24 icon keys", () => {
    expect(ACTIVITY_ICON_KEYS).toHaveLength(24);
    expect(Object.keys(ACTIVITY_ICON_PATHS).sort()).toEqual([...ACTIVITY_ICON_KEYS].sort());
    expect(ACTIVITY_ICON_COLORS).toHaveLength(10);
  });
});
