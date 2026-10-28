import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import { openUrl } from "@/shared/browser-links";
import { HOST_DOWNLOAD_URL } from "@/shared/constants";
import { sendMessage } from "@/lib/messages";
import { Button } from "@/ui/button";
import { IdleCard } from "./idle-activity-card";

const refreshNative = vi.fn();

vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: keyof typeof en) => en[key]
  })
}));
vi.mock("@/hooks/navigation-provider", () => ({
  useNav: () => ({
    push: vi.fn(),
    setTab: vi.fn()
  })
}));
vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => ({
    refresh: { native: refreshNative }
  })
}));
vi.mock("@/shared/browser-links", () => ({ openUrl: vi.fn() }));
vi.mock("@/lib/messages", () => ({ sendMessage: vi.fn() }));

const card = () =>
  IdleCard({
    connection: "no-host",
    paused: false,
    onResume: vi.fn(),
    hasPresences: false
  });

const buttonsIn = (node: ReactNode): Array<ComponentProps<typeof Button>> => {
  if (
    !isValidElement<{
      children?: ReactNode;
    }>(node)
  ) return [];
  if (node.type === Button && isValidElement<ComponentProps<typeof Button>>(node)) return [node.props];

  return Children.toArray(node.props.children).flatMap(buttonsIn);
};

describe("no-host Activity actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders download and retry action buttons with translated labels", () => {
    const buttons = buttonsIn(card());
    expect(buttons.map((button) => button.children)).toEqual([en["action.downloadApp"], en["action.retry"]]);
  });

  it("opens the Desktop download URL on download button click", () => {
    buttonsIn(card())[0]?.onClick?.({} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]);
    expect(openUrl).toHaveBeenCalledExactlyOnceWith(HOST_DOWNLOAD_URL);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("retries native connection before refreshing native status", async () => {
    let finish: (() => void) | undefined;
    vi.mocked(sendMessage).mockReturnValueOnce(
      new Promise<null>((resolve) => {
        finish = () => resolve(null);
      })
    );
    buttonsIn(card())[1]?.onClick?.({} as Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0]);

    expect(sendMessage).toHaveBeenCalledExactlyOnceWith("CONNECT_NATIVE");
    expect(refreshNative).not.toHaveBeenCalled();
    finish?.();
    await Promise.resolve();
    expect(refreshNative).toHaveBeenCalledExactlyOnceWith();
    expect(openUrl).not.toHaveBeenCalled();
  });
});