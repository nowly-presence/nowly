import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  insertDockTab,
  removeDockTab,
  type DockDropTarget,
  type DockLayout,
} from "@/shared/dock-layout";

export type DockDrag<T extends string> = {
  tab: T;
  x: number;
  grabOffset: number;
  width: number;
  top: number;
  height: number;
  target: DockDropTarget | null;
};

const HOLD_MS = 350;
const MOVE_CANCEL_PX = 6;
const HAPTIC_MS = 8;

type Pending<T extends string> = {
  tab: T;
  pointerId: number;
  startX: number;
  startY: number;
  element: HTMLElement;
  timer: number;
};

const targetAt = (row: HTMLElement, x: number, tab: string): DockDropTarget => {
  const groups = Array.from(
    row.querySelectorAll<HTMLElement>("[data-dock-group]"),
  )
    .map((group) => ({
      rect: group.getBoundingClientRect(),
      items: Array.from(
        group.querySelectorAll<HTMLElement>("[data-dock-tab]"),
      ).filter((item) => item.dataset.dockTab !== tab),
    }))
    .filter((group) => group.items.length > 0);
  if (groups.length === 0) return { kind: "new", side: "end" };
  if (x < groups[0].rect.left) return { kind: "new", side: "start" };
  if (x > groups[groups.length - 1].rect.right)
    return { kind: "new", side: "end" };
  const distance = (rect: DOMRect) =>
    x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
  const group = groups.reduce(
    (best, current, index) =>
      distance(current.rect) < distance(groups[best].rect) ? index : best,
    0,
  );
  const index = groups[group].items.filter((item) => {
    const rect = item.getBoundingClientRect();
    return rect.left + rect.width / 2 < x;
  }).length;
  return { kind: "into", group, index };
};

export const useDockDrag = <T extends string>(
  layout: DockLayout<T>,
  onLayoutChange: (layout: DockLayout<T>) => void,
  rowRef: RefObject<HTMLDivElement | null>,
) => {
  const [drag, setDrag] = useState<DockDrag<T> | null>(null);
  const pending = useRef<Pending<T> | null>(null);
  const dragRef = useRef<DockDrag<T> | null>(null);
  const suppressClick = useRef(false);

  const update = (next: DockDrag<T> | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const cancelPending = () => {
    if (pending.current) window.clearTimeout(pending.current.timer);
    pending.current = null;
  };

  const finish = useCallback(
    (commit: boolean) => {
      cancelPending();
      const current = dragRef.current;
      if (!current) return;
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
      if (commit && current.target)
        onLayoutChange(
          insertDockTab(
            removeDockTab(layout, current.tab),
            current.tab,
            current.target,
          ),
        );
      update(null);
    },
    [layout, onLayoutChange],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const waiting = pending.current;
      if (
        waiting &&
        !dragRef.current &&
        event.pointerId === waiting.pointerId
      ) {
        if (
          Math.hypot(
            event.clientX - waiting.startX,
            event.clientY - waiting.startY,
          ) > MOVE_CANCEL_PX
        )
          cancelPending();
        return;
      }
      const current = dragRef.current;
      if (!current || !rowRef.current) return;
      event.preventDefault();
      update({
        ...current,
        x: event.clientX,
        target: targetAt(rowRef.current, event.clientX, current.tab),
      });
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(false);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, rowRef]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>, tab: T) => {
    if (event.button !== 0) return;
    const element = event.currentTarget;
    const { clientX, clientY, pointerId } = event;
    cancelPending();
    const timer = window.setTimeout(() => {
      pending.current = null;
      const rect = element.getBoundingClientRect();
      navigator.vibrate?.(HAPTIC_MS);
      update({
        tab,
        x: clientX,
        grabOffset: clientX - rect.left,
        width: rect.width,
        top: rect.top,
        height: rect.height,
        target: null,
      });
    }, HOLD_MS);
    pending.current = {
      tab,
      pointerId,
      startX: clientX,
      startY: clientY,
      element,
      timer,
    };
  };

  const consumeClick = (): boolean => {
    if (!suppressClick.current) return false;
    suppressClick.current = false;
    return true;
  };

  const preview = drag?.target
    ? insertDockTab(removeDockTab(layout, drag.tab), drag.tab, drag.target)
    : layout;

  return { drag, preview, onPointerDown, consumeClick };
};