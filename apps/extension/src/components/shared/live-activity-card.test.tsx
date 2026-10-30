import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const NOW = new Date("2026-01-01T12:00:00Z");
const nowSeconds = NOW.getTime() / 1000;

describe("LiveCard timeline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("shows playback progress with elapsed and total time", () => {
    const html = render({
      name: "YouTube",
      startTime: nowSeconds - 87,
      endTime: nowSeconds + 1363
    });

    expect(html).toContain('style="width:6%"');
    expect(html).toContain(">1:27</span>");
    expect(html).toContain(">24:10</span>");
  });

  it("shows an end-only countdown without a progress bar", () => {
    const html = render({
      name: "Countdown",
      endTime: nowSeconds + 60
    });

    expect(html).toContain(">-1:00</span>");
    expect(html).not.toContain("transition-[width]");
  });

  it("drains a custom countdown from its start", () => {
    const html = render(
      {
        name: "Custom",
        startTime: nowSeconds - 60,
        endTime: nowSeconds + 240
      },
      undefined,
      "countdown"
    );

    expect(html).toContain('style="width:80%"');
    expect(html).toContain(">4:00</span>");
    expect(html).toContain(">5:00</span>");
  });
});

describe("LiveCard activity heading", () => {
  it("shows only the activity type when both text lines are empty", () => {
    const html = render({
      type: 3,
      name: "My activity",
      details: "  ",
      state: ""
    });

    expect(html).toContain(">Watching</span>");
    expect(html).not.toContain("Watching My activity");
  });

  it("puts the activity name in the heading when a text line is filled", () => {
    const html = render({
      type: 3,
      name: "My activity",
      state: "Second line"
    });

    expect(html).toContain(">Watching My activity</span>");
    expect(html).toContain(">Second line</span>");
  });

  it("lets an explicit status label replace the heading", () => {
    const html = render(
      {
        type: 3,
        name: "My activity"
      },
      "Paused"
    );

    expect(html).toContain(">Paused</span>");
    expect(html).not.toContain(">Watching</span>");
  });
});