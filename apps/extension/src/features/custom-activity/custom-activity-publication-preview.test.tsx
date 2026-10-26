import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CustomActivityPublicationPreview } from "./custom-activity-publication-preview";

const snapshot = vi.hoisted(() => ({
  state: {
    customActivities: {
      items: [
        {
          id: "saved",
          name: "Saved activity",
          details: "Saved details"
        }
      ]
    },
    account: {
      signedIn: true,
      user: {
        name: "Camille",
        image: null
      }
    }
  }
}));

vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => snapshot
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));
vi.mock("@/components/shared/custom-activity-artwork", () => ({
  CustomActivityArtwork: () => <span />
}));

describe("saved publication preview", () => {
  it("shows the saved activity and connected author", () => {
    const markup = renderToStaticMarkup(<CustomActivityPublicationPreview id="saved" creatorRequired={false} />);
    expect(markup).toContain("Saved activity");
    expect(markup).toContain("Saved details");
    expect(markup).toContain("Camille");
  });
  it("does not attribute a sync-only account without publishing permission", () => {
    const markup = renderToStaticMarkup(<CustomActivityPublicationPreview id="saved" creatorRequired />);
    expect(markup).not.toContain("Camille");
    expect(markup).toContain("custom.public.authorPlaceholder");
  });
  it("does not invent activity content for an unknown id", () => {
    expect(renderToStaticMarkup(<CustomActivityPublicationPreview id="unknown" creatorRequired />)).toBe("");
  });
});