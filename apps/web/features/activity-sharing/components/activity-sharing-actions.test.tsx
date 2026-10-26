import { createElement, type ButtonHTMLAttributes, type PropsWithChildren } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActivitySharingActions } from "./activity-sharing-actions";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}));
vi.mock("@/components/extension-store-button", () => ({
  ExtensionStoreButton: () => <a>download</a>
}));
vi.mock("@nowly/ui", () => ({
  Button: ({ children, variant, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
  }) => (
    <button data-variant={variant} {...props}>
      {children}
    </button>
  ),
  Dialog: ({ children }: PropsWithChildren) => <>{children}</>,
  DialogTrigger: ({ children }: PropsWithChildren) => <button>{children}</button>,
  DialogContent: () => null,
  DialogDescription: () => null,
  DialogFooter: () => null,
  DialogHeader: () => null,
  DialogTitle: () => null
}));

const render = (revision: number, modified = false) =>
  renderToStaticMarkup(
    createElement(ActivitySharingActions, {
      detected: true,
      status: {
        ok: true,
        installed: true,
        revision,
        modified,
        localFingerprint: "a".repeat(64)
      },
      revision: 2,
      busy: false,
      message: null,
      onApply: vi.fn().mockResolvedValue(true)
    })
  );

describe("shared activity recipient action", () => {
  it("shows only a disabled up-to-date action for an unchanged current copy", () => {
    const html = render(2);
    expect(html).toContain('disabled=""');
    expect(html).toContain("upToDate");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain("keep");
  });

  it("shows only an update dialog trigger for an older copy", () => {
    const html = render(1);
    expect(html).toContain(">update</button>");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain("replace");
  });

  it("keeps a choice available for local changes even at the same revision", () => {
    expect(render(2, true)).toContain(">update</button>");
  });
});