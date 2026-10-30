import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyLegalState, type LegalState } from "@nowly/shared/legal";
import { useLegalDocuments } from "./use-legal-documents";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  setters: [] as ReturnType<typeof vi.fn>[]
}));

vi.mock("react", () => ({
  useCallback: (callback: unknown) => callback,
  useRef: (current: unknown) => ({ current }),
  useState: (value: unknown) => {
    const setter = vi.fn();
    mocks.setters.push(setter);
    return [value, setter];
  },
  useEffect: (effect: () => void) => effect()
}));
vi.mock("@/lib/messages", () => ({ sendMessage: mocks.send }));

const cachedState: LegalState = {
  ...emptyLegalState(),
  dates: {
    tos: "2026-10-24",
    privacy: "2026-10-25"
  },
  checkFailed: true
};

const answer = (state: LegalState, check: () => Promise<unknown> = async () => state) =>
  mocks.send.mockImplementation((type: string) => (type === "GET_LEGAL_STATE" ? Promise.resolve(state) : check()));

const mount = async () => {
  const legal = useLegalDocuments();
  await vi.waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(2));
  const [, setFailed] = mocks.setters;
  return { legal, setFailed };
};

describe("legal documents hook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.setters = [];
    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
    vi.stubGlobal("window", {
      setInterval: vi.fn(),
      clearInterval: vi.fn()
    });
    vi.stubGlobal("chrome", {
      storage: {
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        }
      }
    });
  });

  it("checks in the background without forcing when dates are cached", async () => {
    answer(cachedState);
    await mount();

    expect(mocks.send).toHaveBeenLastCalledWith("CHECK_LEGAL_DOCUMENTS", { force: false });
  });

  it("forces the check when no dates are cached yet", async () => {
    answer(emptyLegalState());
    await mount();

    expect(mocks.send).toHaveBeenLastCalledWith("CHECK_LEGAL_DOCUMENTS", { force: true });
  });

  it("forces a fresh check when the user retries", async () => {
    answer(cachedState);
    const { legal } = await mount();

    await legal.retry();

    expect(mocks.send).toHaveBeenLastCalledWith("CHECK_LEGAL_DOCUMENTS", { force: true });
  });

  it("does not block on a failed check while cached dates are usable", async () => {
    answer(cachedState, () => Promise.reject(new Error("message port closed")));
    const { setFailed } = await mount();

    await vi.waitFor(() => expect(setFailed).toHaveBeenCalledWith(false));
    expect(setFailed).not.toHaveBeenCalledWith(true);
  });

  it("reports a failure when the state cannot be read, or no dates could ever be checked", async () => {
    mocks.send.mockRejectedValue(new Error("unavailable"));
    useLegalDocuments();
    await vi.waitFor(() => expect(mocks.setters[1]).toHaveBeenCalledWith(true));

    mocks.setters = [];
    answer(emptyLegalState(), () => Promise.reject(new Error("message port closed")));
    useLegalDocuments();
    await vi.waitFor(() => expect(mocks.setters[1]).toHaveBeenCalledWith(true));
  });
});