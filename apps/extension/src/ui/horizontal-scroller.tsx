import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { cn } from "@/ui/cn"

type Metrics = { visible: boolean; size: number; offset: number }

export const HScroll = ({ children, className, snap = false }: { children: ReactNode; className?: string; snap?: boolean }) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<Metrics>({ visible: false, size: 0, offset: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, scrollLeft: 0 })

  const measure = useCallback(() => {
    const el = scrollerRef.current
    const track = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const trackWidth = track?.clientWidth ?? el.clientWidth
    if (max <= 1) {
      setMetrics((current) => (current.visible ? { visible: false, size: 0, offset: 0 } : current))
      return
    }
    const size = Math.max(32, (el.clientWidth / el.scrollWidth) * trackWidth)
    const offset = (el.scrollLeft / max) * (trackWidth - size)
    setMetrics({ visible: true, size, offset })
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.deltaY === 0) return
      const max = el.scrollWidth - el.clientWidth
      if (max <= 0) return
      if ((el.scrollLeft <= 0 && event.deltaY < 0) || (el.scrollLeft >= max - 1 && event.deltaY > 0)) return
      event.preventDefault()
      el.scrollBy({ left: event.deltaY })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      observer.disconnect()
      el.removeEventListener("wheel", onWheel)
    }
  }, [measure, children])

  const scrollRatio = (el: HTMLDivElement, track: HTMLDivElement) => (el.scrollWidth - el.clientWidth) / Math.max(1, track.clientWidth - metrics.size)

  const onThumbDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    if (!el) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = { x: event.clientX, scrollLeft: el.scrollLeft }
    setDragging(true)
  }

  const onThumbMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    const track = trackRef.current
    if (!dragging || !el || !track) return
    el.scrollLeft = dragStart.current.scrollLeft + (event.clientX - dragStart.current.x) * scrollRatio(el, track)
  }

  const onTrackDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current
    const track = trackRef.current
    if (!el || !track) return
    const target = event.clientX - track.getBoundingClientRect().left - metrics.size / 2
    el.scrollTo({ left: target * scrollRatio(el, track), behavior: "smooth" })
  }

  return (
    <div className="-mx-4 flex flex-col gap-2">
      <div
        ref={scrollerRef}
        onScroll={measure}
        className={cn("scrollbar-none flex overflow-x-auto px-4", snap && "snap-x snap-mandatory scroll-px-4", className)}
      >
        {children}
      </div>
      <div className={cn("px-4 transition-opacity duration-200", metrics.visible ? "opacity-100" : "pointer-events-none h-0 opacity-0")} aria-hidden>
        <div ref={trackRef} onPointerDown={onTrackDown} className="group relative h-1.5 cursor-pointer rounded-full bg-line">
          <div
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            style={{ width: metrics.size, transform: `translateX(${metrics.offset}px)` }}
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-colors",
              dragging ? "bg-muted" : "bg-line-strong group-hover:bg-muted/60",
            )}
          />
        </div>
      </div>
    </div>
  )
}
