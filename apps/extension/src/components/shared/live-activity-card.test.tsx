import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import { LiveCard } from "@/components/shared/live-activity-card";
import type { Translate } from "@/hooks/i18n-provider";
import type { PresencePayload } from "@/shared/types";

const t: Translate = (key, params) => {
  let value: string = en[key];

  for (const [name, replacement] of Object.entries(params ?? {})) value = value.replaceAll(`{${name}}`, String(replacement));

  return value;
};

const render = (presence: PresencePayload, statusLabel?: string, timelineMode?: "playback" | "countdown") =>
  renderToStaticMarkup(
    createElement(LiveCard, {
      slug: "__custom",
      presence,
      presenceName: presence.name ?? "",
      t,
      statusLabel,
      timelineMode
    })
  );

afterEach(() => vi.useRealTimers());

describe("LiveCard timeline", () => {
  it("fills the bar according to elapsed playback time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const now = Date.now() / 1000;

    const html = render({
      name: "YouTube",
      startTime: now - 87,
      endTime: now + 1363
    });

    expect(html).toContain('style="width:6%"');
    expect(html).toContain(">1:27</span>");
    expect(html).toContain(">24:10</span>");
  });

  it("does not show a playback bar for an end-only countdown", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));

    const html = render({
      name: "Countdown",
      endTime: Date.now() / 1000 + 60
    });

    expect(html).toContain(">-1:00</span>");
    expect(html).not.toContain("transition-[width]");
  });

  it("drains the bar and shows remaining time for a custom countdown", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const now = Date.now() / 1000;

    const html = render(
      {
        name: "Custom",
        startTime: now - 60,
        endTime: now + 240
      },
      undefined,
      "countdown"
    );

    expect(html).toContain('style="width:80%"');
    expect(html).toContain(">-4:00</span>");
    expect(html).toContain(">5:00</span>");
  });
});

describe("LiveCard activity heading", () => {
  it.each([
    [2, "Listening"],
    [3, "Watching"],
    [5, "Competing"]
  ])("shows the generic type for %i when both text lines are empty", (type, header) => {
    const html = render({
      type,
      name: "My activity",
      details: "  ",
      state: ""
    });
    expect(html).toContain(`>${header}</span>`);
    expect(html).not.toContain(`${header} My activity`);
    expect(html.match(/My activity/g)).toHaveLength(1);
  });

  it.each([
    [2, "Listening to My activity"],
    [3, "Watching My activity"],
    [5, "Competing in My activity"]
  ])("includes the name in the heading for %i when either line is filled", (type, header) => {
    const html = render({
      type,
      name: "My activity",
      state: "Second line"
    });
    expect(html).toContain(`>${header}</span>`);
    expect(html).toContain(">Second line</span>");
    expect(html.match(/My activity/g)).toHaveLength(1);
  });

  it("keeps the playing layout and explicit status label", () => {
    const playing = render({
      type: 0,
      name: "My activity"
    });
    expect(playing).toContain(`>${en["activity.header.playing"]}</span>`);
    expect(playing.match(/My activity/g)).toHaveLength(1);

    const overridden = render(
      {
        type: 3,
        name: "My activity"
      },
      "Paused"
    );
    expect(overridden).toContain(">Paused</span>");
    expect(overridden).not.toContain(">Watching</span>");
  });
});