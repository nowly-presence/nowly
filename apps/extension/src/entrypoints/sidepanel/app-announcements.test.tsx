import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Route, Tab } from "@/hooks/navigation-provider";
import { App } from "./app";

let onboardingCompleted = false;
let devReplayOnboarding = false;
let tab: Tab = "activity";
let stack: Route[] = [];

vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => ({
    state: {
      ready: true,
      onboarding: { onboardingCompleted, devReplayOnboarding },
      settings: { appearance: "light" },
      activity: null
    },
    updateSettings: vi.fn()
  })
}));
vi.mock("@/hooks/navigation-provider", () => ({
  useNav: () => ({
    tab,
    stack,
    setTab: vi.fn()
  })
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));
vi.mock("@/hooks/use-theme", () => ({
  useResolvedTheme: () => "light"
}));
vi.mock("@/hooks/feature-reveal-provider", () => ({
  FeatureRevealProvider: ({ children }: { children: ReactNode }) => children
}));
vi.mock("@/components/shared/feature-reveal", () => ({
  FeatureReveal: ({ children }: { children: ReactNode }) => children
}));
vi.mock("@/features/legal/legal-gate", () => ({
  LegalGate: ({ children }: { children: ReactNode }) => children
}));
vi.mock("@/features/layout/header", () => ({
  Header: () => <header>App header</header>
}));
vi.mock("@/features/layout/dock", () => ({
  Dock: () => <nav>App dock</nav>
}));
vi.mock("@/features/activity/activity-view", () => ({
  ActivityView: () => <div>Activity screen</div>
}));
vi.mock("@/features/library/library-view", () => ({
  LibraryView: () => <div>Library screen</div>
}));
vi.mock("@/features/custom-activity/custom-activity-view", () => ({
  CustomActivityView: () => <div>Custom screen</div>
}));
vi.mock("@/features/settings/settings-view", () => ({
  SettingsView: () => <div>Settings screen</div>
}));
vi.mock("@/features/announcements/announcements-view", () => ({
  AnnouncementsView: () => <div>News screen</div>
}));
vi.mock("@/features/presence/presence-detail-view", () => ({
  PresenceDetailView: () => <div>Presence detail</div>
}));
vi.mock("@/features/diagnostics/connection-view", () => ({
  ConnectionView: () => <div>Connection screen</div>
}));
vi.mock("@/features/runtime-logs/runtime-logs-view", () => ({
  RuntimeLogsView: () => <div>Logs screen</div>
}));
vi.mock("@/features/custom-activity/custom-activity-editor-view", () => ({
  CustomActivityEditorView: () => <div>Custom editor</div>
}));
vi.mock("@/features/discord-ipc/discord-ipc-view", () => ({
  DiscordIpcView: () => <div>Discord IPC screen</div>
}));
vi.mock("@/features/announcements/announcements-banner", () => ({
  AnnouncementsBanner: () => <aside>Global announcement</aside>
}));
vi.mock("@/features/announcements/announcements-detail-view", () => ({
  AnnouncementsDetailView: ({ id }: { id: string }) => <article>Announcement detail: {id}</article>
}));
vi.mock("@/features/onboarding/onboarding-view", () => ({
  OnboardingView: () => <div>Onboarding progress</div>
}));
vi.mock("@/features/review/review-prompt", () => ({
  ReviewPrompt: () => null
}));
vi.mock("@/features/discord-ipc/discord-ipc-prompt", () => ({
  DiscordIpcPrompt: () => null
}));
vi.mock("@/features/seasonal/halloween-prank", () => ({
  HalloweenPrank: () => null
}));
vi.mock("@/features/seasonal/season-moment", () => ({
  SeasonMoment: () => null
}));
vi.mock("@/features/settings/account-choice-sheet", () => ({
  AccountChoicePrompt: () => null
}));

const renderApp = async () => {
  const stream = await renderToReadableStream(<App />);
  await stream.allReady;
  return new Response(stream).text();
};

describe("app announcement layers", () => {
  beforeEach(() => {
    onboardingCompleted = true;
    devReplayOnboarding = false;
    tab = "activity";
    stack = [];
  });

  it("shows the compact top slot only on the homepage", async () => {
    const html = await renderApp();
    expect(html).toContain("Global announcement");
    expect(html.indexOf("Global announcement")).toBeLessThan(html.indexOf("Activity screen"));
    expect(html).toContain("App dock");
  });

  it.each<Tab>(["store", "custom", "settings", "announcements"])("does not show the banner on the %s tab", async (value) => {
    tab = value;
    const html = await renderApp();
    expect(html).not.toContain("Global announcement");
    expect(html).toContain("App dock");
  });

  it.each<Route>([
    {
      name: "announcement",
      id: "notice"
    },
    {
      name: "presence",
      slug: "nowly"
    },
    { name: "connection" },
    { name: "logs" },
    {
      name: "custom-activity",
      id: null
    },
    { name: "discord-ipc" }
  ])("does not show the banner on pushed route $name", async (route) => {
    stack = [route];
    const html = await renderApp();
    expect(html).not.toContain("Global announcement");
    expect(html).toContain("Activity screen");
  });

  it.each([false, true])("keeps onboarding banner-free, including replay=%s", async (replay) => {
    onboardingCompleted = replay;
    devReplayOnboarding = replay;
    const html = await renderApp();
    expect(html).toContain("Onboarding progress");
    expect(html).not.toContain("Global announcement");
    expect(html).not.toContain("App dock");
    expect(html).not.toContain("Announcement detail:");
  });

  it("retains an active detail layer above the mounted homepage without duplicating the banner", async () => {
    stack = [
      {
        name: "announcement",
        id: "notice"
      }
    ];
    const html = await renderApp();
    expect(html).toContain("Activity screen");
    expect(html).toContain("App dock");
    expect(html).toMatch(/aria-hidden="false"[^>]*>[\s\S]*?Announcement detail: <!-- -->notice/);
    expect(html).not.toContain("Global announcement");
    expect(html).not.toContain("Onboarding progress");
  });
});