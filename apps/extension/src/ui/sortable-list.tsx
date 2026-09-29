import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react"
import { RiDraggable } from "@remixicon/react"
import { cn } from "@/ui/cn"

type SortableListProps<T> = {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T, index: number) => ReactNode
  onReorder: (items: T[]) => void
  label: string
  itemLabel: (item: T) => string
}

type DragState = { index: number; offset: number; over: number }

const move = <T,>(list: T[], from: number, to: number): T[] => {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const SortableList = <T,>({ items, getKey, renderItem, onReorder, label, itemLabel }: SortableListProps<T>) => {
  const [drag, setDrag] = useState<DragState | null>(null)
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const geometry = useRef<{ startY: number; mids: number[]; step: number }>({ startY: 0, mids: [], step: 0 })
  const refocus = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (!refocus.current) return
    const index = items.findIndex((item) => getKey(item) === refocus.current)
    rows.current[index]?.focus()
    refocus.current = null
  }, [items, getKey])

  const onPointerDown = (event: PointerEvent<HTMLLIElement>, index: number) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const rects = rows.current.map((row) => row?.getBoundingClientRect())
    const current = rects[index]
    const neighbour = rects[index + 1] ?? rects[index - 1]
    const gap = current && neighbour ? Math.abs(neighbour.top - current.top) - current.height : 4
    geometry.current = {
      startY: event.clientY,
      mids: rects.map((rect) => (rect ? rect.top + rect.height / 2 : 0)),
      step: (current?.height ?? 0) + Math.max(0, gap),
    }
    setDrag({ index, offset: 0, over: index })
  }

  const onPointerMove = (event: PointerEvent<HTMLLIElement>) => {
    if (!drag) return
    const offset = event.clientY - geometry.current.startY
    const center = geometry.current.mids[drag.index] + offset
    const over = geometry.current.mids.filter((mid, i) => i !== drag.index && mid < center).length
    setDrag({ ...drag, offset, over })
  }

  const onPointerUp = () => {
    if (!drag) return
    if (drag.over !== drag.index) onReorder(move(items, drag.index, drag.over))
    setDrag(null)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    const target = event.key === "ArrowUp" ? index - 1 : event.key === "ArrowDown" ? index + 1 : null
    if (target === null) return
    event.preventDefault()
    if (target < 0 || target >= items.length) return
    refocus.current = getKey(items[index])
    onReorder(move(items, index, target))
  }

  const shiftFor = (index: number): number => {
    if (!drag || index === drag.index) return 0
    if (drag.index < drag.over && index > drag.index && index <= drag.over) return -geometry.current.step
    if (drag.index > drag.over && index >= drag.over && index < drag.index) return geometry.current.step
    return 0
  }

  return (
    <ol aria-label={label} className="flex flex-col gap-1">
      {items.map((item, index) => {
        const dragging = drag?.index === index
        return (
          <li
            key={getKey(item)}
            ref={(node) => {
              rows.current[index] = node
            }}
            tabIndex={0}
            aria-roledescription="sortable"
            aria-label={`${index + 1}. ${itemLabel(item)}`}
            onPointerDown={(event) => onPointerDown(event, index)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
            onKeyDown={(event) => onKeyDown(event, index)}
            style={{ transform: `translateY(${dragging ? drag.offset : shiftFor(index)}px)`, touchAction: "none" }}
            className={cn(
              "relative flex cursor-grab items-center gap-2.5 rounded-sm border bg-canvas py-1.5 pr-2 pl-2 select-none",
              dragging
                ? "z-10 cursor-grabbing border-primary bg-surface"
                : "border-line transition-transform duration-150 ease-out-soft hover:border-line-strong",
            )}
          >
            <span className="w-4 text-center text-label-sm text-muted tabular-nums">{index + 1}</span>
            {renderItem(item, index)}
            <RiDraggable className={cn("size-4 shrink-0", dragging ? "text-primary" : "text-muted")} aria-hidden />
          </li>
        )
      })}
    </ol>
  )
}
