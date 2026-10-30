import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyLegalState, type LegalState } from "@nowly/shared/legal";
import { LegalGate } from "@/features/legal/legal-gate";

const mocks = vi.hoisted(() => ({
  ready: true,
  legal: {} as {
    state: LegalState | null;
    failed: boolean;
  }
}));

vi.mock("@/hooks/extension-state-provider", () => ({
  useExtensionState: () => ({
    state: {
      ready: mocks.ready,
      settings: { appearance: "dark" },
      onboarding: { onboardingCompleted: true }
    }
  })
}));
vi.mock("@/hooks/use-theme", () => ({
  useResolvedTheme: () => "dark"
}));
vi.mock("@/hooks/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));
vi.mock("@/components/shared/wordmark", () => ({
  Wordmark: () => null
}));
vi.mock("@/features/legal/legal-prompt", () => ({
  LegalPrompt: () => "legal-prompt"
}));
vi.mock("@/features/legal/use-legal-documents", () => ({
  useLegalDocuments: () => ({
    ...mocks.legal,
    retry: vi.fn(),
    confirm: vi.fn()
  })
}));

const dates = {
  tos: "2026-10-25",
  privacy: "2026-10-24"
};
const outdated: LegalState = {
  ...emptyLegalState(),
  dates,
  tosAcceptance: {
    date: "2026-09-17",
    recordedAt: "2026-09-18T10:00:00.000Z"
  },
  privacyAcknowledgement: {
    date: "2026-09-17",
    recordedAt: "2026-09-18T10:00:00.000Z"
  },
  checkFailed: true
};

const render = () => renderToStaticMarkup(createElement(LegalGate, null, "app"));

describe("legal gate", () => {
  beforeEach(() => {
    mocks.ready = true;
    mocks.legal = {
      state: null,
      failed: false
    };
  });

  it("opens the app once every document is confirmed, even after a failed check", () => {
    mocks.legal.state = {
      ...outdated,
      tosAcceptance: {
        date: dates.tos,
        recordedAt: "2026-10-26T10:00:00.000Z"
      },
      privacyAcknowledgement: {
        date: dates.privacy,
        recordedAt: "2026-10-26T10:00:00.000Z"
      }
    };

    expect(render()).toBe("app");
  });

  it("asks for confirmation from cached dates when the latest check failed", () => {
    mocks.legal.state = outdated;

    expect(render()).toContain("legal-prompt");
  });

  it("keeps loading instead of showing the error while cached dates wait for the app", () => {
    mocks.ready = false;
    mocks.legal.state = outdated;

    const html = render();

    expect(html).not.toContain("legal.error");
    expect(html).toContain('role="status"');
  });

  it.each<
    [
      string,
      {
        state: LegalState | null;
        failed: boolean;
      }
    ]
  >([
    [
      "the state cannot be read",
      {
        state: null,
        failed: true
      }
    ],
    [
      "no dates could ever be checked",
      {
        state: {
          ...emptyLegalState(),
          checkFailed: true
        },
        failed: false
      }
    ]
  ])("shows the error with Close and Review buttons when %s", (_case, legal) => {
    mocks.legal = legal;

    const html = render();

    expect(html).toContain("legal.error");
    expect(html).toContain("action.close");
    expect(html).toContain("legal.review");
  });
});