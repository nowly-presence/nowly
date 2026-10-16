import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFileDrop } from "./use-file-drop";

const effects = vi.hoisted(() => ({
  run: undefined as (() => void | (() => void)) | undefined,
  setDragging: vi.fn()
}));

vi.mock("react", () => ({
  useState: (value: unknown) => [value, effects.setDragging],
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => void | (() => void)) => {
    effects.run = effect;
  }
}));

const drag = (type: string, files: File[] = [], types = ["Files"]) => {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      types,
      files,
      dropEffect: "none"
    }
  });
  return event;
};

describe("file drop subscriptions", () => {
  let target: EventTarget;
  let cleanup: void | (() => void);
  beforeEach(() => {
    vi.clearAllMocks();
    target = new EventTarget();
    vi.stubGlobal("window", target);
    cleanup = undefined;
  });
  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
  });

  it("does not intercept files while disabled", () => {
    const onFiles = vi.fn();
    useFileDrop(onFiles, false);
    cleanup = effects.run?.();
    const event = drag("drop", [new File(["{}"], "activity.json")]);
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
  });
  it("handles file drops while enabled", () => {
    const onFiles = vi.fn();
    useFileDrop(onFiles, true);
    cleanup = effects.run?.();
    const files = [new File(["{}"], "activity.json")];
    const event = drag("drop", files);
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onFiles).toHaveBeenCalledWith(files);
  });
  it("ignores text drags", () => {
    const onFiles = vi.fn();
    useFileDrop(onFiles, true);
    cleanup = effects.run?.();
    const event = drag("drop", [], ["text/plain"]);
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
  });
  it("removes global listeners when leaving the view", () => {
    const onFiles = vi.fn();
    useFileDrop(onFiles, true);
    cleanup = effects.run?.();
    cleanup?.();
    cleanup = undefined;
    const event = drag("drop", [new File(["{}"], "activity.json")]);
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
    expect(effects.setDragging).toHaveBeenLastCalledWith(false);
  });
  it("keeps the overlay until the final nested drag leaves", () => {
    useFileDrop(vi.fn(), true);
    cleanup = effects.run?.();
    target.dispatchEvent(drag("dragenter"));
    target.dispatchEvent(drag("dragenter"));
    effects.setDragging.mockClear();
    target.dispatchEvent(drag("dragleave"));
    expect(effects.setDragging).not.toHaveBeenCalled();
    target.dispatchEvent(drag("dragleave"));
    expect(effects.setDragging).toHaveBeenCalledWith(false);
  });
});