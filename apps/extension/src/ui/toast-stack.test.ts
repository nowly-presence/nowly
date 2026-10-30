import { describe, expect, it } from "vitest";
import { COLLAPSED_TOASTS, layoutToastStack, TOAST_GAP, TOAST_PEEK, TOAST_SCALE_STEP } from "@/ui/toast-stack";

describe("toast stack layout", () => {
  it("is empty without toasts", () => {
    expect(layoutToastStack([], false)).toEqual({
      items: [],
      height: 0
    });
  });

  it("stacks older toasts behind the newest one, clamped to its height", () => {
    const { items, height } = layoutToastStack([40, 60, 30, 40], false);

    expect(items.map((item) => item.offset)).toEqual([0, TOAST_PEEK, 2 * TOAST_PEEK, 2 * TOAST_PEEK]);
    expect(items.map((item) => item.scale)).toEqual([1, 1 - TOAST_SCALE_STEP, 1 - 2 * TOAST_SCALE_STEP, 1 - 2 * TOAST_SCALE_STEP]);
    expect(items.map((item) => item.clampedHeight)).toEqual([null, 40, 40, 40]);
    expect(items.map((item) => item.hidden)).toEqual([false, false, false, true]);
    expect(height).toBe(40 + (COLLAPSED_TOASTS - 1) * TOAST_PEEK);
  });

  it("only reserves room for the toasts actually shown", () => {
    expect(layoutToastStack([40], false).height).toBe(40);
    expect(layoutToastStack([40, 40], false).height).toBe(40 + TOAST_PEEK);
  });

  it("lays every toast out at full size when expanded", () => {
    const { items, height } = layoutToastStack([40, 60, 30, 40], true);

    expect(items.map((item) => item.offset)).toEqual([0, 40 + TOAST_GAP, 100 + 2 * TOAST_GAP, 130 + 3 * TOAST_GAP]);
    expect(items.every((item) => item.scale === 1 && item.clampedHeight === null && !item.hidden)).toBe(true);
    expect(height).toBe(170 + 3 * TOAST_GAP);
  });
});