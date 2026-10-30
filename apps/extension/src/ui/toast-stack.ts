export const TOAST_PEEK = 10;
export const TOAST_GAP = 8;
export const TOAST_SCALE_STEP = 0.05;
export const COLLAPSED_TOASTS = 3;

export type ToastLayout = {
  offset: number;
  scale: number;
  clampedHeight: number | null;
  hidden: boolean;
};

export const layoutToastStack = (heights: number[], expanded: boolean): {
  items: ToastLayout[];
  height: number;
} => {
  if (heights.length === 0) return {
    items: [],
    height: 0
  };

  if (expanded) {
    let offset = 0;
    const items = heights.map((height) => {
      const item = {
        offset,
        scale: 1,
        clampedHeight: null,
        hidden: false
      };
      offset += height + TOAST_GAP;
      return item;
    });
    return {
      items,
      height: offset - TOAST_GAP
    };
  }

  const front = heights[0];
  return {
    items: heights.map((_, depth) => {
      const layer = Math.min(depth, COLLAPSED_TOASTS - 1);
      return {
        offset: layer * TOAST_PEEK,
        scale: 1 - layer * TOAST_SCALE_STEP,
        clampedHeight: depth === 0 ? null : front,
        hidden: depth >= COLLAPSED_TOASTS
      };
    }),
    height: front + (Math.min(heights.length, COLLAPSED_TOASTS) - 1) * TOAST_PEEK
  };
};