import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import de from "@messages/de.json";
import el from "@messages/el.json";
import en from "@messages/en.json";
import es from "@messages/es.json";
import fr from "@messages/fr.json";
import ja from "@messages/ja.json";
import ko from "@messages/ko.json";
import ms from "@messages/ms.json";
import pl from "@messages/pl.json";
import ptBR from "@messages/pt-BR.json";
import tr from "@messages/tr.json";
import { openUrl } from "@/shared/browser-links";
import { HOST_DOWNLOAD_URL } from "@/shared/constants";
import { sendMessage } from "@/lib/messages";
import { Button } from "@/ui/button";
import { IdleCard } from "./idle-activity-card";

let messages = en;
const refreshNative = vi.fn();

vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: keyof typeof en) => messages[key]
  })
}));
vi.mock("@/hooks/navigation-provider", () => ({
  useNav: () => ({ push: vi.fn() })
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
    messages = en;
    vi.clearAllMocks();
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
  )("keeps complete translated labels in two full-width stacked buttons in %s", (_locale, dictionary) => {
    messages = dictionary;
    const html = renderToStaticMarkup(card());
    const buttons = buttonsIn(card());

    expect(buttons.map((button) => button.children)).toEqual([dictionary["action.downloadApp"], dictionary["action.retry"]]);

    for (const button of buttons)
      expect(button.className?.split(" ")).toEqual(expect.arrayContaining(["w-full", "min-w-0", "h-auto!", "min-h-9", "whitespace-normal!"]));

    expect(html).toContain('class="flex flex-col gap-2"');
    expect(html).not.toMatch(/flex-1|grow|flex-wrap/);
    expect(html.match(/<button /g)).toHaveLength(2);
    expect(html).not.toContain("truncate");
    expect(html).not.toContain("overflow-hidden");
  });

  it("opens the unchanged Desktop download URL", () => {
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