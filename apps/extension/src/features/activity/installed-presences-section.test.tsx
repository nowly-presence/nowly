import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import de from "@messages/de.json";
import el from "@messages/el.json";
import es from "@messages/es.json";
import fr from "@messages/fr.json";
import ja from "@messages/ja.json";
import ko from "@messages/ko.json";
import ms from "@messages/ms.json";
import pl from "@messages/pl.json";
import ptBR from "@messages/pt-BR.json";
import tr from "@messages/tr.json";
import type { StoredPresence } from "@/shared/types";
import { Button } from "@/ui/button";
import { InstalledPresencesSection } from "./installed-presences-section";

let grid = false;
let updatingAll = false;
let availableUpdates: [string, StoredPresence][] = [];
let messages = en;
const updateAll = vi.fn();
const updateSettings = vi.fn();

vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => ({
    state: {
      settings: { presenceDisplayMode: grid ? "grid" : "category" },
      updates: {}
    },
    updateSettings
  })
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: keyof typeof en) => messages[key],
    locale: "en"
  })
}));
vi.mock("@/hooks/navigation-provider", () => ({
  useNav: () => ({
    push: vi.fn(),
    setTab: vi.fn()
  })
}));
vi.mock("@/hooks/use-presence-actions", () => ({
  usePresenceActions: () => ({
    availableUpdates,
    updatingAll,
    updateAll,
    toggle: vi.fn()
  })
}));
vi.mock("@/lib/presence-status", () => ({
  presenceStatus: () => ({ kind: "ready" })
}));
vi.mock("./presence-status-text", () => ({
  statusText: () => ({})
}));
vi.mock("./presence-grid-card", () => ({
  PresenceGridCard: () => <div>Grid card</div>
}));
vi.mock("./presence-list-row", () => ({
  PresenceListRow: () => <div>List row</div>
}));
vi.mock("@/components/shared/seasonal-decor", () => ({
  SeasonalDecor: () => null
}));

const metadata: StoredPresence["metadata"] = {
  slug: "fixture",
  name: "Fixture",
  author: { name: "Fixture" },
  description: { en: "Fixture" },
  url: ["example.test"],
  color: "#000000",
  category: "other"
};
const stored: StoredPresence = {
  metadata,
  enabled: true,
  installedAt: 1,
  release: {
    slug: "fixture",
    version: "1",
    metadata,
    bundle: "",
    sha256: "",
    metadataHash: "",
    signature: "",
    signedAt: ""
  }
};
const presences: [string, StoredPresence][] = [
  ["first", stored],
  ["second", stored],
  ["third", stored]
];

const section = () =>
  InstalledPresencesSection({
    presences,
    detectedSlugs: new Set(),
    now: 1
  });

const children = (node: ReactNode): ReactNode[] =>
  isValidElement<{
    children?: ReactNode;
  }>(node)
    ? Children.toArray(node.props.children)
    : [];

const actionButtons = () => children(section().props.action).filter((node) => isValidElement<ComponentProps<typeof Button>>(node));

describe("installed presence header bulk action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    grid = false;
    updatingAll = false;
    availableUpdates = [];
    messages = en;
  });

  it.each([false, true])("preserves the original toggle appearance for zero or one update, grid=%s", (mode) => {
    grid = mode;

    for (const count of [0, 1]) {
      availableUpdates = presences.slice(0, count);
      const buttons = actionButtons();
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.props.className).toContain("size-7");
      expect(buttons[0]?.props.className).not.toContain("border");
      expect(renderToStaticMarkup(section())).not.toContain(en["activity.updateAll"]);
    }
  });

  it.each([false, true])("places bulk action left of the outlined fixed-size toggle at 2+ updates, grid=%s", (mode) => {
    grid = mode;

    for (const count of [2, 3]) {
      availableUpdates = presences.slice(0, count);
      const [bulk, toggle] = actionButtons();
      expect(bulk?.type).toBe(Button);
      expect(bulk?.props.children).toBe(en["activity.updateAll"]);
      expect(toggle?.props.className).toContain("size-8");
      expect(toggle?.props.className).not.toContain("size-7");
      expect(toggle?.props.className).toContain("border border-line-strong");
      expect(toggle?.props["aria-label"]).toBe(en[mode ? "activity.viewList" : "activity.viewGrid"]);
      toggle?.props.onClick?.({} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]);
      expect(updateSettings).toHaveBeenLastCalledWith({ presenceDisplayMode: mode ? "category" : "grid" });
    }
  });

  it("invokes the batch and retains disabled busy bulk action and outline while eligibility drops to one or zero", () => {
    availableUpdates = presences.slice(0, 2);
    const bulk = actionButtons()[0];
    bulk?.props.onClick?.({} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]);
    expect(updateAll).toHaveBeenCalledOnce();
    updatingAll = true;

    for (const count of [1, 0]) {
      availableUpdates = presences.slice(0, count);
      const html = renderToStaticMarkup(section());
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('disabled=""');
      expect(actionButtons()[1]?.props.className).toContain("border border-line-strong");
      expect(actionButtons()[1]?.props.className).toContain("size-8");
      expect(actionButtons()[1]?.props.className).not.toContain("size-7");
    }

    updatingAll = false;
    expect(actionButtons()).toHaveLength(1);
    expect(actionButtons()[0]?.props.className).not.toContain("border");
  });

  it.each(
    Object.entries({
      de,
      el,
      en,
      es,
      fr,
      ja,
      ko,
      ms,
      pl,
      "pt-BR": ptBR,
      tr
    })
  )("provides the full localized action label in %s", (_locale, dictionary) => {
    messages = dictionary;
    availableUpdates = presences.slice(0, 2);
    expect(dictionary["activity.updateAll"].length).toBeGreaterThan(0);
    expect(actionButtons()[0]?.props.children).toBe(dictionary["activity.updateAll"]);
    expect(section().props.className).toContain("flex-wrap");
  });
});