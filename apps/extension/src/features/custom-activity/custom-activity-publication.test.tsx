import { Children, createElement, isValidElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import { useCustomActivityPublication } from "./custom-activity-publication-hook";
import { CustomActivityPublication } from "./custom-activity-publication";
import { CustomActivityPublicationDialog } from "./custom-activity-publication-dialog";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { sendMessage } from "@/lib/messages";

vi.mock("./custom-activity-publication-hook", () => ({ useCustomActivityPublication: vi.fn() }));
vi.mock("./custom-activity-publication-preview", () => ({
  CustomActivityPublicationPreview: () => <div data-testid="saved-preview" />
}));
vi.mock("@/ui/toast", () => ({
  useToast: () => ({ toast: vi.fn() })
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

const panel = () =>
  CustomActivityPublicationDialog({
    id: "saved-id",
    onClose: vi.fn()
  });

const markup = () => renderToStaticMarkup(panel());

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
    expect(useCustomActivityPublication).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });
  it("uses an accessible preview dialog without the italic notice", () => {
    expect(markup()).not.toContain(en["custom.public.notice"]);
    expect(markup()).toContain('data-testid="saved-preview"');
    expect(markup()).toContain('data-testid="custom-publication"');
    expect(markup()).toContain('role="dialog"');
    expect(panel().type).toBe(Sheet);
    expect(panel().props.open).toBe(true);
    expect(panel().props.title).toBe(en["custom.public.share"]);
    expect(panel().props.description).toBe(en["custom.public.invitation"]);
    expect(markup()).not.toContain(en["custom.public.description"]);
    expect(fr["custom.public.summary"]).toBe("Version enregistrée et profil Discord publics.");
    expect(fr["custom.public.summary"].length).toBeLessThanOrEqual(50);
    expect(fr["custom.public.notice"].length).toBeLessThanOrEqual(85);
  });
  it("treats missing publishing permission as a normal sign-in row with just Connect Discord", () => {
    state = {
      ...state,
      creatorRequired: true,
      revision: null
    };
    expect(buttons().map((button) => button.children)).toEqual([en["custom.public.connect"]]);
    expect(markup()).toContain(en["custom.public.connectHint"]);
    expect(panel().props.hideTitle).toBe(true);
    expect(panel().props.description).toBeUndefined();
    expect(markup()).toContain("text-headline-sm");
    expect(panel().props.title).toBe(en["custom.public.connect"]);
    expect(markup()).not.toContain('data-testid="saved-preview"');
    expect(markup()).not.toContain(en["custom.public.notice"]);
    expect(markup()).toContain('class="flex flex-col gap-1"');
    expect(buttons()[0].className).toBe("mt-2 w-full");
    expect(markup()).not.toContain("pb-6 text-center");
    expect(markup()).not.toContain('role="alert"');
    expect(markup()).not.toContain("text-danger");
  });
  it("offers Publish when ready, Update when public, and withdrawal for revision-zero reservations", () => {
    expect(buttons().map((button) => button.children)).toEqual([en["custom.public.publish"]]);
    state = {
      ...state,
      published: true,
      url: "https://nowly.me/activities/abc",
      revision: 1
    };
    expect(buttons().map((button) => button.children)).toEqual([en["custom.public.update"], en["custom.public.unpublish"]]);
    expect(buttons()[1].variant).toBe("secondary");
    expect(markup()).toContain(en["custom.public.copy"]);
    expect(markup()).toContain(`href="${state.url}"`);
    expect(markup()).toContain(`aria-label="${en["custom.public.open"]}"`);
    expect(markup()).toContain('role="group"');
    expect(markup()).toContain("divide-x");
    expect(markup()).not.toContain("underline-offset-4");
    const html = markup();
    expect(panel().props.title).toBe(en["custom.public.updateTitle"]);
    expect(panel().props.description).toBe(en["custom.public.updateHint"]);
    expect(html.indexOf(en["custom.public.open"])).toBeLessThan(html.lastIndexOf(en["custom.public.update"]));
    const actionGroup = elements(panel()).find(
      (node) =>
        isValidElement<{
          children?: ReactNode;
        }>(node) && Children.toArray(node.props.children).filter((child) => isValidElement(child) && child.type === Button).length === 2
    );
    expect(actionGroup).toBeDefined();
    state = {
      ...state,
      published: false,
      revision: 0
    };
    expect(buttons().map((button) => button.children)).toEqual([en["custom.public.publish"], en["custom.public.unpublish"]]);
    expect(markup()).not.toContain(`href="${state.url}"`);
    expect(markup()).toContain(en["custom.public.unpublished"]);
  });
  it("keeps unexpected errors visible and disables publishing until metadata is ready", () => {
    state = {
      ...state,
      revision: null,
      error: "Could not load publication"
    };
    expect(buttons()[0].disabled).toBe(true);
    expect(markup()).toContain('role="alert"');
    expect(markup()).toContain(state.error);
  });
  it("does not connect or publish while rendering and wires explicit actions only", () => {
    markup();
    expect(state.publish).not.toHaveBeenCalled();
    expect(state.connect).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
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
    expect(buttons().every((button) => button.loading)).toBe(true);
  });
  it("disables unchanged or unverified updates without disabling withdrawal", () => {
    state = {
      ...state,
      published: true,
      url: "https://nowly.me/activities/abc",
      revision: 1,
      hasChanges: false
    };
    expect(buttons()[0].disabled).toBe(true);
    expect(buttons()[1].disabled).toBe(false);
    state = {
      ...state,
      hasChanges: null
    };
    expect(buttons()[0].disabled).toBe(true);
    state = {
      ...state,
      hasChanges: true
    };
    expect(buttons()[0].disabled).toBe(false);
  });
  it("renders an existing public revision without initiating an update", () => {
    state = {
      ...state,
      published: true,
      url: "https://nowly.me/activities/abc",
      revision: 3
    };
    markup();
    markup();
    expect(state.revision).toBe(3);
    expect(state.publish).not.toHaveBeenCalled();
    expect(buttons()[0].children).toBe(en["custom.public.update"]);
    expect(markup()).not.toContain(en["custom.public.notice"]);
  });
});