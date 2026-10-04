import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/ui/cn"

type DockItem<T extends string> = { value: T; label: string; icon: ReactNode; activeIcon: ReactNode; badge?: "live" | number; wrap?: (button: ReactNode) => ReactNode }

const ITEM_CHROME = 18 + 8 + 28

export const Dock = <T extends string>({ items, value, onChange, label }: { items: DockItem<T>[]; value: T; onChange: (value: T) => void; label: string }) => {
  const barRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const labels = items.map((item) => item.label).join("|")

  useLayoutEffect(() => {
    const bar = barRef.current
    const measure = measureRef.current
    if (!bar || !measure) return
    const check = () => {
      const widths = Array.from(measure.querySelectorAll<HTMLElement>(":scope > span")).map((label) => label.offsetWidth + ITEM_CHROME)
      const perItem = (bar.clientWidth - 8 - 4 * (items.length - 1)) / items.length
      setCompact(widths.some((width) => width > perItem))
    }
    check()
    const observer = new ResizeObserver(check)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [labels, items.length])

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
      <div ref={barRef} className="pointer-events-auto relative flex w-full max-w-[340px] items-center gap-1 rounded-xl border border-tertiary-edge bg-tertiary p-1">
        {items.map((item) => {
          const active = item.value === value
          const showLabel = active || !compact
          const button = (
            <button
              key={item.value}
              type="button"
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={showLabel ? undefined : item.label}
              onClick={() => onChange(item.value)}
              className={cn(
                "relative flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-3.5 text-label-md font-medium whitespace-nowrap transition-[color,background-color,flex-grow] duration-300 ease-out-soft",
                compact ? (active ? "flex-[2.2]" : "flex-1") : "flex-1",
                active ? "bg-tertiary-line text-on-tertiary" : "text-on-tertiary-muted hover:text-on-tertiary",
              )}
            >
              <span className="relative flex shrink-0">
                {active ? item.activeIcon : item.icon}
                {item.badge === "live" && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-success ring-2 ring-tertiary" />}
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-tertiary-accent px-1 text-[9px] leading-none font-medium text-tertiary">
                    {item.badge}
                  </span>
                )}
              </span>
              {showLabel && <span className="min-w-0 truncate">{item.label}</span>}
            </button>
          )
          return item.wrap ? <Fragment key={item.value}>{item.wrap(button)}</Fragment> : button
        })}
      </div>
    </nav>
  )
}
