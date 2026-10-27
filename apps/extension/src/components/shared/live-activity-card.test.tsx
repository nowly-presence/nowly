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
  it("renders playback progress, end-only countdown, and custom countdown draining correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const now = Date.now() / 1000;

    // 1. Elapsed playback time
    const playbackHtml = render({
      name: "YouTube",
      startTime: now - 87,
      endTime: now + 1363
    });
    expect(playbackHtml).toContain('style="width:6%"');
    expect(playbackHtml).toContain(">1:27</span>");
    expect(playbackHtml).toContain(">24:10</span>");

    // 2. End-only countdown (no playback progress bar)
    const endOnlyHtml = render({
      name: "Countdown",
      endTime: now + 60
    });
    expect(endOnlyHtml).toContain(">-1:00</span>");
    expect(endOnlyHtml).not.toContain("transition-[width]");

    // 3. Custom countdown draining
    const countdownHtml = render(
      {
        name: "Custom",
        startTime: now - 60,
        endTime: now + 240
      },
      undefined,
      "countdown"
    );
    expect(countdownHtml).toContain('style="width:80%"');
    expect(countdownHtml).toContain(">4:00</span>");
    expect(countdownHtml).toContain(">5:00</span>");
  });
});

describe("LiveCard activity heading", () => {
  it("adapts activity heading based on presence type, state/details presence, and statusLabel override", () => {
    // 1. Generic type when both lines are empty
    const emptyDetails = render({
      type: 3,
      name: "My activity",
      details: "  ",
      state: ""
    });
    expect(emptyDetails).toContain(">Watching</span>");
    expect(emptyDetails).not.toContain("Watching My activity");

    // 2. Activity name in heading when lines are filled
    const filledDetails = render({
      type: 3,
      name: "My activity",
      state: "Second line"
    });
    expect(filledDetails).toContain(">Watching My activity</span>");
    expect(filledDetails).toContain(">Second line</span>");

    // 3. Explicit statusLabel override
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
