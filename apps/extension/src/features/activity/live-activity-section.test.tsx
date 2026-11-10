import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import { LiveActivitySection } from "./live-activity-section";

const extensionState = vi.fn();
const discordIpcIssueOf = vi.fn();

vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: keyof typeof en) => en[key]
  })
}));
vi.mock("@/hooks/navigation-provider", () => ({
  useNav: () => ({ push: vi.fn() })
}));
vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => extensionState()
}));
vi.mock("@/lib/messages", () => ({ sendMessage: vi.fn() }));
vi.mock("@/shared/discord-ipc-prompt", () => ({
  discordIpcIssueOf: (native: unknown) => discordIpcIssueOf(native)
}));

const stateWith = (showPlayer: boolean) => ({
  state: {
    activity: undefined,
    presences: {},
    native: {
      connected: false,
      discordConnected: false,
      status: "idle"
    },
    customActivities: {
      items: [{ id: "custom" }]
    },
    settings: { showPlayer }
  },
  updateSettings: vi.fn(),
  refresh: {}
});

const section = () => renderToStaticMarkup(<LiveActivitySection hasPresences />);

describe("LiveActivitySection preview toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    discordIpcIssueOf.mockReturnValue({ active: false });
  });

  it("renders the idle section while the preview is enabled", () => {
    extensionState.mockReturnValue(stateWith(true));
    expect(section()).toContain(en["action.downloadApp"]);
  });

  it("renders nothing while the preview is disabled", () => {
    extensionState.mockReturnValue(stateWith(false));
    expect(section()).toBe("");
  });

  it("keeps the section for the Discord IPC alert when the preview is disabled", () => {
    extensionState.mockReturnValue(stateWith(false));
    discordIpcIssueOf.mockReturnValue({ active: true });
    expect(section()).toContain(en["discordIpc.alertDescription"]);
    expect(section()).not.toContain(en["action.downloadApp"]);
  });
});