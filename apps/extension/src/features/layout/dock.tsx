import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { domMax, LayoutGroup, LazyMotion, m } from "motion/react";
import type { DockLayout } from "@/shared/dock-layout";
import { cn } from "@/ui/cn";
import { useDockDrag } from "@/features/layout/use-dock-drag";

type DockItem<T extends string> = {
  value: T;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  badge?: "live" | number;
  wrap?: (button: ReactNode) => ReactNode;
};

export type DockAction<T extends string> = {
  anchor: T;
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

type DockProps<T extends string> = {
  items: DockItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  layout: DockLayout<T>;
  onLayoutChange: (layout: DockLayout<T>) => void;
  action?: DockAction<T>;
};

const ITEM_CHROME = 18 + 8 + 28;
const ICON_ITEM_WIDTH = 40;
const GROUP_GAP = 8;
const GROUP_PADDING = 8;
const ITEM_GAP = 4;
const LIFT_PX = 6;
const REFLOW = {
  type: "spring",
  stiffness: 520,
  damping: 40
} as const;

const HIDE_DELAY_MS = 180;
const NECK_WIDTH = 44;
const NECK_HEIGHT = 12;
const NECK_RADIUS = 10;
const NECK_PATH = `M0 0Q${NECK_RADIUS} 0 ${NECK_RADIUS} ${NECK_HEIGHT / 2}Q${NECK_RADIUS} ${NECK_HEIGHT} 0 ${NECK_HEIGHT}L${NECK_WIDTH} ${NECK_HEIGHT}Q${NECK_WIDTH - NECK_RADIUS} ${NECK_HEIGHT} ${NECK_WIDTH - NECK_RADIUS} ${NECK_HEIGHT / 2}Q${NECK_WIDTH - NECK_RADIUS} 0 ${NECK_WIDTH} 0Z`;
const SPRING = "ease-[cubic-bezier(0.34,1.4,0.64,1)]";

const DockDrop = <T extends string>({ action, center, revealed }: { action: DockAction<T>; center: number; revealed: boolean }) => (
  <>
    <svg
      aria-hidden
      width={NECK_WIDTH}
      height={NECK_HEIGHT}
      viewBox={`0 0 ${NECK_WIDTH} ${NECK_HEIGHT}`}
      className={cn("pointer-events-none absolute bottom-full origin-bottom fill-primary transition-transform duration-300", SPRING)}
      style={{
        left: center - NECK_WIDTH / 2,
        transform: `translateY(1px) scaleY(${revealed ? 1 : 0})`
      }}
    >
      <path d={NECK_PATH} />
    </svg>
    <div
      className={cn(
        "absolute bottom-full z-10 transition-[transform,opacity] duration-500",
        SPRING,
        revealed ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      style={{
        left: center,
        paddingBottom: NECK_HEIGHT,
        transform: revealed ? "translate(-50%, 0) scale(1)" : "translate(-50%, 40px) scale(0.6)"
      }}
    >
      <button
        type="button"
        tabIndex={revealed ? 0 : -1}
        onClick={action.onClick}
        className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-label-md font-medium whitespace-nowrap text-on-primary transition-[filter] hover:brightness-[1.06] focus-visible:brightness-[1.06] active:brightness-95"
      >
        {action.icon}
        {action.label}
      </button>
    </div>
  </>
);

const ItemContent = <T extends string>({ item, active, showLabel }: { item: DockItem<T>; active: boolean; showLabel: boolean }) => (
  <>
    <span className="relative flex shrink-0">
      {active ? item.activeIcon : item.icon}
      {item.badge === "live" && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-success ring-2 ring-tertiary" />}
      {typeof item.badge === "number" && item.badge > 0 && (
        <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-tertiary-accent px-1 text-[9px] leading-none font-medium text-tertiary">
          {item.badge}
        </span>
      )}
    </span>
    {showLabel && <span className="whitespace-nowrap">{item.label}</span>}
  </>
);

export const Dock = <T extends string>({ items, value, onChange, label, layout, onLayoutChange, action }: DockProps<T>) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const { drag, preview, onPointerDown, consumeClick } = useDockDrag(layout, onLayoutChange, rowRef);
  const labels = items.map((item) => item.label).join("|");
  const byValue = new Map(items.map((item) => [item.value, item]));
  const groupCount = preview.length;
  const hideTimer = useRef<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [center, setCenter] = useState(0);
  const revealed = Boolean(action) && hovered && !drag;

  useEffect(() => () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  const show = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    const row = rowRef.current;
    const anchor = action ? row?.querySelector<HTMLElement>(`[data-dock-tab="${action.anchor}"]`) : null;

    if (!row || !anchor) return;

    const rowRect = row.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    setCenter(anchorRect.left + anchorRect.width / 2 - rowRect.left);
    setHovered(true);
  };

  const hide = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setHovered(false), HIDE_DELAY_MS);
  };

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;

    if (!row || !measure) return;

    const check = () => {
      const widths = Array.from(measure.querySelectorAll<HTMLElement>(":scope > span")).map((span) => span.offsetWidth + ITEM_CHROME);

      const chrome = GROUP_PADDING * groupCount + GROUP_GAP * (groupCount - 1) + ITEM_GAP * (items.length - groupCount);
      setCompact(widths.reduce((sum, width) => sum + width, 0) > row.clientWidth - chrome);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(row);
    return () => observer.disconnect();
  }, [labels, items.length, groupCount]);

  const draggedItem = drag ? byValue.get(drag.tab) : undefined;

  return (
    <nav aria-label={label} className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pt-6 pb-3">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-canvas via-canvas/85 to-transparent" />
      <div ref={measureRef} aria-hidden className="invisible absolute flex whitespace-nowrap">
        {items.map((item) => (
          <span key={item.value} className="text-label-md font-medium">
            {item.label}
          </span>
        ))}
      </div>
      <LazyMotion features={domMax} strict>
        <LayoutGroup>
          <div
            ref={rowRef}
            className={cn("pointer-events-auto relative flex w-full items-center justify-center", groupCount > 1 ? "max-w-[372px]" : "max-w-[340px]")}
            style={{ gap: GROUP_GAP }}
            onPointerEnter={action ? show : undefined}
            onPointerLeave={action ? hide : undefined}
            onFocus={action ? show : undefined}
            onBlur={action ? (event) => !event.currentTarget.contains(event.relatedTarget) && hide() : undefined}
          >
            {action && <DockDrop action={action} center={center} revealed={revealed} />}
            {preview.map((group, groupIndex) => (
              <m.div
                key={groupIndex}
                layout
                transition={REFLOW}
                data-dock-group={groupIndex}
                className="flex min-w-fit items-center rounded-xl border border-tertiary-edge bg-tertiary p-1"
                style={{
                  gap: ITEM_GAP,
                  flexGrow: group.length > 1 ? group.length : 0,
                  flexShrink: 1,
                  flexBasis: "auto"
                }}
              >
                {group.map((tab) => {
                  const item = byValue.get(tab);

                  if (!item) return null;

                  const active = item.value === value;
                  const showLabel = active || !compact;
                  const placeholder = drag?.tab === tab;
                  const button = (
                    <button
                      type="button"
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                      title={showLabel ? undefined : item.label}
                      onPointerDown={(event) => onPointerDown(event, item.value)}
                      onContextMenu={(event) => event.preventDefault()}
                      onClick={() => {
                        if (!consumeClick()) onChange(item.value);
                      }}
                      className={cn(
                        "relative flex h-10 w-full touch-none items-center justify-center gap-2 rounded-md px-3.5 text-label-md font-medium whitespace-nowrap transition-colors duration-300 ease-out-soft select-none",
                        active ? "bg-tertiary-line text-on-tertiary" : "text-on-tertiary-muted hover:text-on-tertiary",
                        placeholder && "invisible"
                      )}
                    >
                      <ItemContent item={item} active={active} showLabel={showLabel} />
                    </button>
                  );
                  return (
                    <m.div
                      key={item.value}
                      layoutId={`dock-${item.value}`}
                      layout="position"
                      transition={REFLOW}
                      data-dock-tab={item.value}
                      className={cn(
                        "relative",
                        compact && active ? "flex-none" : "min-w-0 flex-1",
                        placeholder && "rounded-md border border-dashed border-tertiary-line"
                      )}
                      style={compact && !active ? { minWidth: ICON_ITEM_WIDTH } : undefined}
                    >
                      {item.wrap ? <Fragment>{item.wrap(button)}</Fragment> : button}
                    </m.div>
                  );
                })}
              </m.div>
            ))}
          </div>
        </LayoutGroup>
      </LazyMotion>
      {drag && draggedItem && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-40 flex scale-105 items-center justify-center gap-2 rounded-md border border-tertiary-edge bg-tertiary px-3.5 text-label-md font-medium text-on-tertiary ring-1 ring-tertiary-line"
          style={{
            left: Math.min(Math.max(0, drag.x - drag.grabOffset), window.innerWidth - drag.width),
            top: drag.top - LIFT_PX,
            width: drag.width,
            height: drag.height
          }}
        >
          <ItemContent item={draggedItem} active={draggedItem.value === value} showLabel={draggedItem.value === value || !compact} />
        </div>
      )}
    </nav>
  );
};