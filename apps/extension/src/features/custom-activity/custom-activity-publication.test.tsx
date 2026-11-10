import { Children, createElement, isValidElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import { useCustomActivityPublication } from "./custom-activity-publication-hook";
import { CustomActivityPublication } from "./custom-activity-publication";
import { CustomActivityPublicationDialog } from "./custom-activity-publication-dialog";
import { Button } from "@/ui/button";
import { sendMessage } from "@/lib/messages";

const toast = vi.hoisted(() => vi.fn());

vi.mock("./custom-activity-publication-hook", () => ({ useCustomActivityPublication: vi.fn() }));
vi.mock("./custom-activity-publication-preview", () => ({
  CustomActivityPublicationPreview: () => <div data-testid="saved-preview" />
}));
vi.mock("@/ui/toast", () => ({
  useToast: () => ({ toast })
}));
vi.mock("@/ui/sheet", () => ({
  Sheet: ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
    <div role="dialog" aria-label={title}>
      {description && <p>{description}</p>}
      {children}
    </div>
  )
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: keyof typeof en) => en[key]
  })
}));
vi.mock("@/components/shared/feature-reveal", () => ({
  FeatureReveal: ({ children }: { children: ReactNode }) => children
}));
vi.mock("@/lib/messages", () => ({ sendMessage: vi.fn() }));

const initialState = () => ({
  busy: false,
  url: null,
  error: null,
  published: false,
  creatorRequired: false,
  revision: 0,
  hasChanges: true,
  publish: vi.fn(),
  connect: vi.fn()
});

let state: ReturnType<typeof useCustomActivityPublication>;

const panel = (onClose = vi.fn()) =>
  CustomActivityPublicationDialog({
    id: "saved-id",
    onClose
  });

const markup = () => renderToStaticMarkup(panel());

const renderedButtons = () =>
  [...markup().matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([, attributes, content]) => ({
    label: content.replace(/<[^>]+>/g, ""),
    disabled: /\bdisabled=""/.test(attributes)
  }));

const actionLabels = () =>
  renderedButtons()
    .map(({ label }) => label)
    .filter((label) => label !== en["custom.public.copy"]);

const actionDisabled = (label: string) => renderedButtons().find((button) => button.label === label)?.disabled;

const elements = (node: ReactNode): ReactNode[] => {
  if (
    !isValidElement<{
      children?: ReactNode;
      trailing?: ReactNode;
      action?: ReactNode;
    }>(node)
  ) return [];

  return [node, ...Children.toArray([node.props.children, node.props.trailing, node.props.action]).flatMap(elements)];
};

const buttons = () =>
  elements(panel()).flatMap((node) =>
    isValidElement<ComponentProps<typeof Button>>(node) && node.type === Button && node.props.children !== en["custom.public.copy"] ? [node.props] : []
  );

describe("public activity sharing dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state = initialState();
    vi.mocked(useCustomActivityPublication).mockImplementation(() => state);
  });
  it("renders a standalone action without connecting or publishing", () => {
    const entry = renderToStaticMarkup(createElement(CustomActivityPublication, { id: "saved-id" }));
    expect(entry).toContain(en["custom.public.share"]);
    expect(entry).not.toContain('role="dialog"');

    expect(sendMessage).not.toHaveBeenCalled();
  });
  it("names the publication dialog and shows the saved preview", () => {
    const html = markup();
    expect(html).toContain(`role="dialog" aria-label="${en["custom.public.share"]}"`);
    expect(html).toContain(en["custom.public.invitation"]);
    expect(html).toContain('data-testid="saved-preview"');
  });
  it("treats missing publishing permission as a normal sign-in row with just Connect Discord", () => {
    state = {
      ...state,
      creatorRequired: true,
      revision: null
    };
    expect(actionLabels()).toEqual([en["custom.public.connect"]]);
    expect(markup()).toContain(en["custom.public.connectHint"]);
    expect(markup()).not.toContain('data-testid="saved-preview"');
    expect(markup()).not.toContain('role="alert"');
  });
  it("offers Publish when ready, Update when public, and withdrawal for revision-zero reservations", () => {
    expect(actionLabels()).toEqual([en["custom.public.publish"]]);
    state = {
      ...state,
      published: true,
      url: "https://nowly.me/activities/abc",
      revision: 1
    };
    expect(actionLabels()).toEqual([en["custom.public.update"], en["custom.public.unpublish"]]);
    expect(markup()).toContain(en["custom.public.copy"]);
    expect(markup()).toContain(`href="${state.url}"`);
    expect(markup()).toContain(`aria-label="${en["custom.public.open"]}"`);
    expect(markup()).toContain('role="group"');
    const html = markup();
    expect(html.indexOf(en["custom.public.open"])).toBeLessThan(html.lastIndexOf(en["custom.public.update"]));
    state = {
      ...state,
      published: false,
      revision: 0
    };
    expect(actionLabels()).toEqual([en["custom.public.publish"], en["custom.public.unpublish"]]);
    expect(markup()).not.toContain(`href="${state.url}"`);
    expect(markup()).toContain(en["custom.public.unpublished"]);
  });
  it("keeps unexpected errors visible and disables publishing until metadata is ready", () => {
    state = {
      ...state,
      revision: null,
      error: "Could not load publication"
    };
    expect(actionDisabled(en["custom.public.publish"])).toBe(true);
    expect(markup()).toContain('role="alert"');
    expect(markup()).toContain(state.error);
  });
  it("does not connect or publish while rendering and wires explicit actions only", () => {
    markup();
    expect(state.publish).not.toHaveBeenCalled();
    expect(state.connect).not.toHaveBeenCalled();
    const unpublished = state;
    state = {
      ...state,
      published: true,
      revision: 3,
      url: "https://nowly.me/activities/abc"
    };
    markup();
    expect(state.publish).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
    state = unpublished;
    const click = (index: number) => {
      const button = buttons()[index];
      button.onClick?.({} as Parameters<NonNullable<typeof button.onClick>>[0]);
    };
    click(0);
    expect(state.publish).toHaveBeenCalledExactlyOnceWith();
    state = {
      ...state,
      url: "https://nowly.me/activities/abc",
      revision: 0
    };
    click(1);
    expect(state.publish).toHaveBeenLastCalledWith(true);
    state = {
      ...state,
      creatorRequired: true
    };
    click(0);
    expect(state.connect).toHaveBeenCalledExactlyOnceWith();
    expect(buttons()).toHaveLength(1);
  });
  it("keeps actions busy during a request", () => {
    state = {
      ...state,
      busy: true,
      url: "https://nowly.me/activities/abc"
    };
    expect(actionDisabled(en["custom.public.publish"])).toBe(true);
    expect(actionDisabled(en["custom.public.unpublish"])).toBe(true);
  });
  it("closes and confirms successful withdrawal with a toast", async () => {
    const onClose = vi.fn();
    state = {
      ...state,
      url: "https://nowly.me/activities/abc",
      revision: 1,
      published: true
    };
    vi.mocked(state.publish).mockResolvedValueOnce(true);
    const button = elements(panel(onClose)).find(
      (node) => isValidElement<ComponentProps<typeof Button>>(node) && node.type === Button && node.props.children === en["custom.public.unpublish"]
    );

    if (!isValidElement<ComponentProps<typeof Button>>(button)) throw new Error("Missing withdrawal button");

    button.props.onClick?.({} as Parameters<NonNullable<typeof button.props.onClick>>[0]);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(state.publish).toHaveBeenCalledExactlyOnceWith(true);
    expect(toast).toHaveBeenCalledExactlyOnceWith(en["custom.public.unpublished"]);
  });
  it("keeps the dialog open without a success toast when withdrawal fails", async () => {
    const onClose = vi.fn();
    state = {
      ...state,
      url: "https://nowly.me/activities/abc",
      revision: 1,
      published: true
    };
    const response = Promise.resolve(false);
    vi.mocked(state.publish).mockReturnValueOnce(response);
    const button = elements(panel(onClose)).find(
      (node) => isValidElement<ComponentProps<typeof Button>>(node) && node.type === Button && node.props.children === en["custom.public.unpublish"]
    );

    if (!isValidElement<ComponentProps<typeof Button>>(button)) throw new Error("Missing withdrawal button");

    button.props.onClick?.({} as Parameters<NonNullable<typeof button.props.onClick>>[0]);
    expect(state.publish).toHaveBeenCalledExactlyOnceWith(true);
    await response;
    expect(onClose).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });
  it("disables unchanged or unverified updates without disabling withdrawal", () => {
    state = {
      ...state,
      published: true,
      url: "https://nowly.me/activities/abc",
      revision: 1,
      hasChanges: false
    };
    expect(actionDisabled(en["custom.public.update"])).toBe(true);
    expect(actionDisabled(en["custom.public.unpublish"])).toBe(false);
    state = {
      ...state,
      hasChanges: null
    };
    expect(actionDisabled(en["custom.public.update"])).toBe(true);
    state = {
      ...state,
      hasChanges: true
    };
    expect(actionDisabled(en["custom.public.update"])).toBe(false);
  });
});