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

  it("handles drag-and-drop lifecycle, filtering non-file drags and cleaning up listeners", () => {
    const onFiles = vi.fn();
    useFileDrop(onFiles, false);
    cleanup = effects.run?.();

    // 1. Disabled: does not intercept
    const disabledDrop = drag("drop", [new File(["{}"], "activity.json")]);
    target.dispatchEvent(disabledDrop);
    expect(disabledDrop.defaultPrevented).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();

    // 2. Enabled: ignores non-file text drag, handles valid file drop
    cleanup?.();
    useFileDrop(onFiles, true);
    cleanup = effects.run?.();

    const textDrag = drag("drop", [], ["text/plain"]);
    target.dispatchEvent(textDrag);
    expect(textDrag.defaultPrevented).toBe(false);

    const files = [new File(["{}"], "activity.json")];
    const validDrop = drag("drop", files);
    target.dispatchEvent(validDrop);
    expect(validDrop.defaultPrevented).toBe(true);
    expect(onFiles).toHaveBeenCalledWith(files);

    // 3. Nested drag counter overlay behavior
    target.dispatchEvent(drag("dragenter"));
    target.dispatchEvent(drag("dragenter"));
    effects.setDragging.mockClear();
    target.dispatchEvent(drag("dragleave"));
    expect(effects.setDragging).not.toHaveBeenCalled();
    target.dispatchEvent(drag("dragleave"));
    expect(effects.setDragging).toHaveBeenCalledWith(false);

    // 4. Cleanup removes global listeners
    cleanup?.();
    cleanup = undefined;
    const postCleanupDrop = drag("drop", [new File(["{}"], "activity.json")]);
    target.dispatchEvent(postCleanupDrop);
    expect(postCleanupDrop.defaultPrevented).toBe(false);
  });
});