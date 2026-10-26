import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, isValidElement, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AnnouncementSchema } from "@nowly/shared/announcements";
import messages from "@messages/en.json";
import { emptyAnnouncements } from "@/shared/announcements";
import { AnnouncementsBanner } from "./announcements-banner";
import { AnnouncementsView } from "./announcements-view";
import { AnnouncementsDetailView } from "./announcements-detail-view";

let announcements = emptyAnnouncements();
let locale = "en";
let currentNow = Date.parse("2026-10-24T12:00:00Z");
const navigation = {
  push: vi.fn(),
  pop: vi.fn(),
  setTab: vi.fn()
};

vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => ({
    state: { announcements },
    patch: vi.fn()
  })
}));
vi.mock("@/hooks/navigation-provider", () => ({
  useNav: () => navigation
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    locale,
    t: (key: keyof typeof messages, parameters?: Record<string, string | number>) => {
      let text = messages[key];

      for (const [name, value] of Object.entries(parameters ?? {})) text = text.replaceAll(`{${name}}`, String(value));

      return text;
    }
  })
}));
vi.mock("./announcements-clock", () => ({
  useAnnouncementsClock: () => currentNow
}));

const notice = (overrides: Record<string, unknown> = {}) =>
  AnnouncementSchema.parse({
    id: "notice",
    source: "announcement",
    kind: "normal",
    pinned: true,
    translations: {
      en: {
        title: "English notice",
        description: "Public details",
        content: "## Details\n\n**Safe** content"
      },
      fr: {
        title: "Annonce française",
        description: "Informations",
        content: "## Détails\n\n**Sûr**"
      }
    },
    publishedAt: "2026-10-24T11:00:00Z",
    updatedAt: "2026-10-24T11:00:00Z",
    ...overrides
  });

describe("announcement screens", () => {
  beforeEach(() => {
    announcements = {
      ...emptyAnnouncements(),
      fetchedAt: Date.parse("2026-10-24T12:00:00Z")
    };
    locale = "en";
    currentNow = Date.parse("2026-10-24T12:00:00Z");
    vi.clearAllMocks();
  });
  it("renders banners with soft tone styling, navigation callbacks, and semantic constraints", () => {
    // Maintenance banner
    announcements.items = [
      notice({
        kind: "maintenance",
        endsAt: "2026-10-24T12:30:00Z"
      })
    ];
    let html = renderToStaticMarkup(<AnnouncementsBanner />);
    expect(html).toContain('href="#announcements"');
    expect(html).toContain('aria-label="English notice. News"');
    expect(html).toContain("bg-primary-soft hover:bg-primary-soft-hover");
    expect(html).not.toContain("Dismiss");

    // Warning banner level 3 (danger)
    announcements.items = [notice({ kind: "warning", severity: 3 })];
    html = renderToStaticMarkup(<AnnouncementsBanner />);
    expect(html).toContain("bg-danger-soft hover:bg-danger-soft-hover");

    // Banner click navigation
    const banner = AnnouncementsBanner();
    if (!isValidElement<{ children: ReactNode }>(banner)) throw new Error("Missing banner");
    const link = Children.toArray(banner.props.children).find((child) => isValidElement(child) && child.type === "a");
    if (!isValidElement<ComponentProps<"a">>(link)) throw new Error("Missing link");
    const preventDefault = vi.fn();
    link.props.onClick?.({ preventDefault } as unknown as MouseEvent<HTMLAnchorElement>);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(navigation.setTab).toHaveBeenCalledWith("announcements");
  });

  it("renders announcements view list and details with localized dates and markdown", () => {
    announcements.items = [
      notice({
        id: "notice-1",
        kind: "warning",
        severity: 2,
        translations: {
          en: { title: "Incident 2", description: "Public details", content: "Safe content" }
        }
      })
    ];
    let html = renderToStaticMarkup(<AnnouncementsView />);
    expect(html).toContain("Incident 2");
    expect(html).toContain('dateTime="2026-10-24T11:00:00Z"');

    // Detail view
    locale = "fr";
    html = renderToStaticMarkup(<AnnouncementsDetailView id="notice" />);
    expect(html).toContain(messages["announcements.unavailable"]);
    announcements.items = [notice()];
    html = renderToStaticMarkup(<AnnouncementsDetailView id="notice" />);
    expect(html).toContain("Annonce française");
    expect(html).toContain("<strong>Sûr</strong>");
  });

  it("handles loading, offline, and expiration states gracefully", () => {
    announcements = emptyAnnouncements();
    expect(renderToStaticMarkup(<AnnouncementsView />)).toContain('aria-busy="true"');

    announcements.offline = true;
    const offlineHtml = renderToStaticMarkup(<AnnouncementsView />);
    expect(offlineHtml).toContain('role="status"');
    expect(offlineHtml).toContain("Refresh news");

    // Expired notice
    announcements.items = [notice({ expiresAt: "2026-10-24T12:00:00Z" })];
    expect(renderToStaticMarkup(<AnnouncementsBanner />)).toBe("");
    expect(renderToStaticMarkup(<AnnouncementsDetailView id="notice" />)).toContain("This notice is no longer available");
  });
});
