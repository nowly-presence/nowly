import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, isValidElement, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AnnouncementSchema, announcementRevision } from "@nowly/shared/announcements";
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
  it("renders maintenance as one named native News link with no disclosure, body or dismissal", () => {
    announcements.items = [
      notice({
        kind: "maintenance",
        endsAt: "2026-10-24T12:30:00Z"
      })
    ];
    const html = renderToStaticMarkup(<AnnouncementsBanner />);

    expect(html).toContain('href="#announcements"');
    expect(html).toContain('aria-label="English notice. News"');
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html.match(/<svg /g)).toHaveLength(1);

    for (const value of ["<button", "aria-expanded", "aria-controls", " hidden=", "Public details", "Estimated end in", "<p ", "<time"])
      expect(html).not.toContain(value);

    expect(html).not.toContain("Dismiss");
    expect(html).not.toContain("announcement-tone");
    expect(html).not.toContain("data-tone");
    expect(html).toContain("border-0");
    expect(html).toContain("outline-none");
    expect(html).toContain("focus-visible:outline-2");
  });

  it.each([
    {
      kind: "normal",
      severity: null,
      background: "bg-surface hover:bg-canvas"
    },
    {
      kind: "maintenance",
      severity: null,
      background: "bg-primary-soft hover:bg-primary-soft-hover"
    },
    {
      kind: "warning",
      severity: 1,
      background: "bg-announcement-warning-low-soft hover:bg-announcement-warning-low-soft-hover"
    },
    {
      kind: "warning",
      severity: 2,
      background: "bg-announcement-warning-medium-soft hover:bg-announcement-warning-medium-soft-hover"
    },
    {
      kind: "warning",
      severity: 3,
      background: "bg-danger-soft hover:bg-danger-soft-hover"
    }
  ])("renders $kind/$severity with its soft background and matching hover, no dot and only the navigation arrow SVG", ({ kind, severity, background }) => {
    announcements.items = [notice({ kind, severity })];
    const html = renderToStaticMarkup(<AnnouncementsBanner />);
    expect(html).toContain(background);
    expect(html.match(/<span /g)).toHaveLength(1);
    expect(html).not.toContain("rounded-full");
    expect(html).not.toContain('<span aria-hidden="true"');
    expect(html).not.toContain("brightness-");
    expect(html).not.toContain("hover:bg-hover");
    expect(html.match(/<svg /g)).toHaveLength(1);
    expect(html).toContain("items-center");
    expect(html).not.toContain("animate-");
    expect(html).not.toContain("bg-success");
    expect(html).not.toContain("Warning (level");
    expect(html).toContain("text-ink");
    expect(html).not.toContain("text-primary");
    expect(html).not.toContain("text-danger");
    expect(html).toContain('href="#announcements"');
  });

  it("activates the News tab through the link callback without pushing a detail route or changing announcement state", () => {
    announcements.items = [notice({ kind: "maintenance" })];
    const before = structuredClone(announcements);
    const banner = AnnouncementsBanner();

    if (
      !isValidElement<{
        children: ReactNode;
      }>(banner)
    ) throw new Error("Missing banner");

    const link = Children.toArray(banner.props.children).find((child) => isValidElement(child) && child.type === "a");

    if (!isValidElement<ComponentProps<"a">>(link)) throw new Error("Missing native navigation link");

    const preventDefault = vi.fn();
    link.props.onClick?.({ preventDefault } as unknown as MouseEvent<HTMLAnchorElement>);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(navigation.setTab).toHaveBeenCalledExactlyOnceWith("announcements");
    expect(navigation.push).not.toHaveBeenCalled();
    expect(announcements).toEqual(before);
  });
  it("renders titles once and date-only metadata without redundant kinds, severity labels or icons", () => {
    announcements.items = [1, 2, 3].map((severity) =>
      notice({
        id: `warning-${severity}`,
        kind: "warning",
        severity,
        translations: {
          en: {
            title: `Incident ${severity}`,
            description: "Public details",
            content: "Details"
          }
        }
      })
    );
    const html = renderToStaticMarkup(<AnnouncementsView />);
    expect(html).toContain("border-line bg-surface");
    expect(html).toContain('role="button" tabindex="0"');
    expect(html).not.toContain("announcement-tone");
    expect(html).not.toContain("Refresh news");

    for (const severity of [1, 2, 3]) {
      expect(html.split(`Incident ${severity}`)).toHaveLength(2);
      expect(html).not.toContain(`Warning (level ${severity})`);
    }

    expect(html).not.toContain("data-tone");
    expect(html).not.toContain("Pinned announcement");
    expect(html).not.toContain("ri-error-warning");
    expect(html).toContain('dateTime="2026-10-24T11:00:00Z"');
  });
  it("keeps read posts notified and localizes detail with plain secondary metadata", () => {
    const item = notice();
    announcements.items = [item];
    announcements.read = [announcementRevision(item)];
    expect(renderToStaticMarkup(<AnnouncementsBanner />)).toContain("English notice");
    const feed = renderToStaticMarkup(<AnnouncementsView />);
    expect(feed).toContain("English notice");
    expect(feed).not.toContain("Unread");
    locale = "fr";
    const detail = renderToStaticMarkup(<AnnouncementsDetailView id="notice" />);
    expect(detail).toContain("Annonce française");
    expect(detail).toContain("<strong>Sûr</strong>");
    expect(detail).toContain("text-label-sm font-normal text-muted");
    expect(detail).toContain("font-size:calc(var(--text-label-sm) - 2px)");
    expect(detail).not.toContain("Notes de version");
    expect(detail).not.toContain("Avertissement");
    expect(detail).not.toContain("data-tone");
    expect(detail.split("Annonce française")).toHaveLength(2);
    expect(detail).not.toContain("announcement-tone");
    expect(detail).not.toContain("rounded-sm border p-3");
  });

  it("shows accessible loading and an inline retry only when the connection fails", () => {
    announcements = emptyAnnouncements();
    const loading = renderToStaticMarkup(<AnnouncementsView />);
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("Checking for news");
    expect(loading).not.toContain("Refresh news");
    announcements.offline = true;
    const offline = renderToStaticMarkup(<AnnouncementsView />);
    expect(offline).toContain('role="status"');
    expect(offline).toContain("Refresh news");
    expect(offline).not.toContain('aria-busy="true"');
  });

  it.each([
    {
      source: "changelog",
      kind: "normal",
      severity: null
    },
    {
      source: "announcement",
      kind: "warning",
      severity: 3
    }
  ])("keeps $source detail date-only with one title and only the Back navigation icon", (overrides) => {
    announcements.items = [notice(overrides)];
    const html = renderToStaticMarkup(<AnnouncementsDetailView id="notice" />);
    expect(html.split("English notice")).toHaveLength(2);
    expect(html).toContain('dateTime="2026-10-24T11:00:00Z"');
    expect(html).not.toContain("Release notes");
    expect(html).not.toContain("Warning (level");
    expect(html.match(/<svg /g)).toHaveLength(1);
  });

  it("retains published, scheduled-start, estimated-end and explicit-expiry dates as semantic times", () => {
    const dates = {
      startsAt: "2026-10-24T11:30:00Z",
      endsAt: "2026-10-24T12:30:00Z",
      expiresAt: "2026-10-25T12:00:00Z"
    };
    announcements.items = [notice(dates)];

    for (const html of [
      renderToStaticMarkup(<AnnouncementsView />),
      renderToStaticMarkup(<AnnouncementsDetailView id="notice" />)
    ]) {
      for (const date of ["2026-10-24T11:00:00Z", ...Object.values(dates)]) expect(html).toContain(`dateTime="${date}"`);

      expect(html).not.toContain("Estimated end in");
      expect(html).not.toContain("Pinned announcement");
    }
  });
  it.each([-1, 0, 1])("retains feed and detail while ending only the banner at estimated-end offset %i ms", (offset) => {
    announcements.items = [notice({ endsAt: "2026-10-24T12:00:00Z" })];
    currentNow += offset;

    for (const offline of [false, true]) {
      announcements.offline = offline;
      const banner = renderToStaticMarkup(<AnnouncementsBanner />);
      expect(banner.includes("English notice")).toBe(offset < 0);
      const feed = renderToStaticMarkup(<AnnouncementsView />);
      const detail = renderToStaticMarkup(<AnnouncementsDetailView id="notice" />);

      for (const html of [feed, detail]) {
        expect(html).toContain("English notice");
        expect(html).not.toContain("This notice is no longer available");
        expect(html).not.toContain("Estimated end in");
        expect(html).toContain("Estimated end:");
        expect(html).toContain('dateTime="2026-10-24T12:00:00Z"');
        expect(html).not.toContain("Pinned announcement");
      }

      expect(detail).toContain("<strong>Safe</strong>");
    }
  });

  it("removes explicitly expired notices from open details and banners", () => {
    announcements.items = [notice({ expiresAt: "2026-10-24T12:00:00Z" })];
    expect(renderToStaticMarkup(<AnnouncementsBanner />)).toBe("");
    const detail = renderToStaticMarkup(<AnnouncementsDetailView id="notice" />);
    expect(detail).toContain("This notice is no longer available");
    expect(detail).not.toContain("English notice");
  });
});