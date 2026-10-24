import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import en from "@messages/en.json";
import { LiveCard } from "@/components/shared/live-activity-card";
import type { Translate } from "@/hooks/i18n-provider";
import type { PresencePayload } from "@/shared/types";

const t: Translate = (key, params) => {
  let value: string = en[key];
  for (const [name, replacement] of Object.entries(params ?? {})) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
};

const render = (presence: PresencePayload, statusLabel?: string) => renderToStaticMarkup(createElement(LiveCard, {
  slug: "__custom",
  presence,
  presenceName: presence.name ?? "",
  t,
  statusLabel
}));

describe("LiveCard activity heading", () => {
  it.each([
    [2, "Listening"],
    [3, "Watching"],
    [5, "Competing"]
  ])("shows the generic type for %i when both text lines are empty", (type, header) => {
    const html = render({ type, name: "My activity", details: "  ", state: "" });
    expect(html).toContain(`>${header}</span>`);
    expect(html).not.toContain(`${header} My activity`);
    expect(html.match(/My activity/g)).toHaveLength(1);
  });

  it.each([
    [2, "Listening to My activity"],
    [3, "Watching My activity"],
    [5, "Competing in My activity"]
  ])("includes the name in the heading for %i when either line is filled", (type, header) => {
    const html = render({ type, name: "My activity", state: "Second line" });
    expect(html).toContain(`>${header}</span>`);
    expect(html).toContain(">Second line</span>");
    expect(html.match(/My activity/g)).toHaveLength(1);
  });

  it("keeps the playing layout and explicit status label", () => {
    const playing = render({ type: 0, name: "My activity" });
    expect(playing).toContain(`>${en["activity.header.playing"]}</span>`);
    expect(playing.match(/My activity/g)).toHaveLength(1);

    const overridden = render({ type: 3, name: "My activity" }, "Paused");
    expect(overridden).toContain(">Paused</span>");
    expect(overridden).not.toContain(">Watching</span>");
  });
});
