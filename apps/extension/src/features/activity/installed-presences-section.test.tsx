import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import type { StoredPresence } from "@/shared/types";
import { Button } from "@/ui/button";
import { InstalledPresencesSection } from "./installed-presences-section";

let grid = false;
let updatingAll = false;
let availableUpdates: [string, StoredPresence][] = [];
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
    t: (key: keyof typeof en) => en[key],
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
  });

  it("shows single display-mode toggle when fewer than 2 updates are available", () => {
    availableUpdates = presences.slice(0, 1);
    const buttons = actionButtons();
    expect(buttons).toHaveLength(1);
  });

  it("switches from grid to category display mode", () => {
    grid = true;
    const [toggle] = actionButtons();

    expect(toggle?.props["aria-label"]).toBe(en["activity.viewList"]);
    toggle?.props.onClick?.({} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]);
    expect(updateSettings).toHaveBeenLastCalledWith({ presenceDisplayMode: "category" });
  });

  it("reveals bulk update button and triggers updateAll on click when 2+ updates exist", () => {
    availableUpdates = presences.slice(0, 2);
    const [bulk, toggle] = actionButtons();

    expect(bulk?.type).toBe(Button);
    expect(bulk?.props.children).toBe(en["activity.updateAll"]);

    bulk?.props.onClick?.({} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]);
    expect(updateAll).toHaveBeenCalledOnce();

    toggle?.props.onClick?.({} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]);
    expect(updateSettings).toHaveBeenLastCalledWith({ presenceDisplayMode: "grid" });
  });
});