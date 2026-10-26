import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEASON_RESPONSE_TIMEOUT_MS, SITE_SEASONS, type SiteSeason } from "./site-season";
import { startSiteSeason } from "./site-season-sync";

const setup = ({
  preview = "",
  visible = true,
  initial = ["font", "dark"]
}: {
  preview?: string;
  visible?: boolean;
  initial?: string[];
} = {}) => {
  const tokens = new Set(initial);
  const root = {
    classList: {
      add: (token: string) => tokens.add(token),
      remove: (token: string) => tokens.delete(token)
    }
  };
  const target = Object.assign(new EventTarget(), {
    location: {
      origin: "https://nowly.me",
      search: preview
    },
    postMessage: vi.fn(),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    localStorage: {
      getItem: () => {
        throw new Error("season cache must not be read");
      }
    }
  });
  const page = Object.assign(new EventTarget(), {
    documentElement: root,
    visibilityState: visible ? "visible" : "hidden"
  });
  vi.stubGlobal("window", target);
  vi.stubGlobal("document", page);
  const onChange = vi.fn<(season: SiteSeason | null) => void>();
  const stop = startSiteSeason({
    allowPreview: Boolean(preview),
    onChange
  });
  const receive = (season: SiteSeason | null, {
    origin = target.location.origin,
    source = target
  }: {
    origin?: string;
    source?: unknown;
  } = {}) => {
    const event = new MessageEvent("message", {
      origin,
      data: {
        source: "Nowly",
        type: "SEASON",
        payload: { season }
      }
    });
    Object.defineProperty(event, "source", { value: source });
    target.dispatchEvent(event);
  };
  const visibility = (visible: boolean) => {
    page.visibilityState = visible ? "visible" : "hidden";
    page.dispatchEvent(new Event("visibilitychange"));
  };
  const seasonalClasses = () => [...tokens].filter((token) => token.startsWith("season-"));
  return { target, onChange, stop, receive, visibility, seasonalClasses, tokens };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("site season synchronization", () => {
  it("starts neutral even if a previous theme is still on the document", () => {
    const site = setup({
      initial: ["font", "dark", "season-winter", "season-leaving"]
    });
    expect([...site.tokens]).toEqual(["font", "dark"]);
    expect(site.onChange.mock.calls.every(([season]) => season === null)).toBe(true);
    expect(site.target.postMessage).toHaveBeenCalledWith(
      {
        source: "Nowly",
        type: "GET_SEASON"
      },
      "https://nowly.me"
    );
    site.receive(null);
    vi.runAllTimers();
    expect(site.seasonalClasses()).toEqual([]);
    expect(site.onChange.mock.calls.every(([season]) => season === null)).toBe(true);
  });

  it("activates any valid season after confirmation and removes it immediately when disabled", () => {
    for (const season of SITE_SEASONS) {
      const site = setup();
      expect(site.seasonalClasses()).toEqual([]);
      site.receive(season);
      expect(site.seasonalClasses()).toEqual([`season-${season}`]);
      expect(site.onChange).toHaveBeenLastCalledWith(season);
      site.receive(null);
      expect(site.seasonalClasses()).toEqual([]);
      expect(site.onChange).toHaveBeenLastCalledWith(null);
      expect(vi.getTimerCount()).toBe(0);
    }
  });

  it("removes all season effects while hidden and until a fresh visible confirmation", () => {
    for (const season of SITE_SEASONS) {
      const site = setup();
      site.receive(season);
      site.visibility(false);
      expect(site.seasonalClasses()).toEqual([]);
      expect(site.onChange).toHaveBeenLastCalledWith(null);
      expect(vi.getTimerCount()).toBe(0);
      site.receive(season);
      expect(site.seasonalClasses()).toEqual([]);
      site.visibility(true);
      expect(site.seasonalClasses()).toEqual([]);
      site.receive(null);
      expect(site.seasonalClasses()).toEqual([]);
      expect(site.onChange).toHaveBeenLastCalledWith(null);
    }
  });

  it("can reactivate the same season after a fresh answer", () => {
    const site = setup();
    site.receive("winter");
    site.visibility(false);
    site.visibility(true);
    site.receive("winter");
    expect(site.seasonalClasses()).toEqual(["season-winter"]);
    expect(site.onChange).toHaveBeenLastCalledWith("winter");
  });

  it("stays neutral if the extension does not answer on load or after returning", () => {
    const site = setup();
    vi.advanceTimersByTime(SEASON_RESPONSE_TIMEOUT_MS);
    expect(site.seasonalClasses()).toEqual([]);
    site.receive("winter");
    site.visibility(false);
    site.visibility(true);
    vi.advanceTimersByTime(SEASON_RESPONSE_TIMEOUT_MS);
    expect(site.seasonalClasses()).toEqual([]);
    expect(site.onChange).toHaveBeenLastCalledWith(null);
  });

  it("does not activate effects when the page starts in a hidden tab", () => {
    const site = setup({ visible: false });
    site.receive("winter");
    expect(site.seasonalClasses()).toEqual([]);
    expect(site.target.postMessage).not.toHaveBeenCalled();
    site.visibility(true);
    expect(site.target.postMessage).toHaveBeenCalledTimes(1);
    expect(site.seasonalClasses()).toEqual([]);
  });

  it("ignores replies from other origins and frames", () => {
    const site = setup();
    site.receive("winter", { origin: "https://other.example" });
    site.receive("winter", { source: null });
    expect(site.seasonalClasses()).toEqual([]);
    expect(site.onChange.mock.calls.every(([season]) => season === null)).toBe(true);
  });

  it("clears effects before entering the back-forward cache and revalidates on restore", () => {
    const site = setup();
    site.receive("winter");
    site.target.dispatchEvent(new Event("pagehide"));
    expect(site.seasonalClasses()).toEqual([]);
    const event = new Event("pageshow");
    Object.defineProperty(event, "persisted", { value: true });
    site.target.dispatchEvent(event);
    expect(site.target.postMessage).toHaveBeenCalledTimes(2);
    expect(site.seasonalClasses()).toEqual([]);
  });

  it("preserves explicit development previews", () => {
    const site = setup({ preview: "?season=spring" });
    site.receive(null);
    site.visibility(false);
    vi.runAllTimers();
    expect(site.seasonalClasses()).toEqual(["season-spring"]);
    expect(site.target.postMessage).not.toHaveBeenCalled();
    site.stop();
    expect(site.seasonalClasses()).toEqual([]);
  });

  it("removes listeners, timers and all effects when unmounted", () => {
    const site = setup();
    site.receive("winter");
    site.visibility(true);
    site.stop();
    expect(vi.getTimerCount()).toBe(0);
    site.receive("winter");
    site.visibility(true);
    expect(site.seasonalClasses()).toEqual([]);
    expect(site.target.postMessage).toHaveBeenCalledTimes(2);
    expect(site.onChange).toHaveBeenLastCalledWith(null);
  });
});