import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react"
import { cn } from "@/ui/cn"

export type SelectOption = { value: string; label: string; hint?: string; icon?: ReactNode }

type SelectProps = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  "aria-label": string
  className?: string
  disabled?: boolean
}

const MENU_MAX_HEIGHT = 272
const GAP = 6
const MENU_MIN_WIDTH = 208

export const Select = ({ value, options, onChange, className, disabled, ...props }: SelectProps) => {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const typeahead = useRef({ text: "", at: 0 })
  const listId = useId()
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const below = window.innerHeight - rect.bottom - GAP - 8
    const above = rect.top - GAP - 8
    const estimated = Math.min(MENU_MAX_HEIGHT, options.length * 34 + 8)
    const flip = below < estimated && above > below
    const width = Math.max(rect.width, MENU_MIN_WIDTH)
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
    setPosition(
      flip
        ? { left, width, bottom: window.innerHeight - rect.top + GAP, maxHeight: Math.min(MENU_MAX_HEIGHT, above) }
        : { left, width, top: rect.bottom + GAP, maxHeight: Math.min(MENU_MAX_HEIGHT, below) },
    )
  }, [options.length])

  const openMenu = () => {
    if (disabled) return
    setActive(selectedIndex)
    place()
    setOpen(true)
  }

  const close = useCallback((focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }, [])

  const choose = (index: number) => {
    const option = options[index]
    if (option && option.value !== value) onChange(option.value)
    close()
  }

  const revealActive = useCallback((index: number) => {
    const list = listRef.current
    const option = list?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    if (!list || !option) return
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop - 4
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight + 4
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    listRef.current?.focus({ preventScroll: true })
    revealActive(active)
  }, [open, active, revealActive])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!listRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false)
    }
    const onScroll = (event: Event) => {
      const target = event.target
      if (target instanceof Node && listRef.current?.contains(target)) return
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) close(false)
      else place()
    }
    window.addEventListener("pointerdown", onPointer, true)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", place)
    return () => {
      window.removeEventListener("pointerdown", onPointer, true)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", place)
    }
  }, [open, close, place])

  const onTriggerKey = (event: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault()
      openMenu()
    }
  }

  const onListKey = (event: KeyboardEvent) => {
    const last = options.length - 1
    if (event.key === "ArrowDown") setActive((index) => Math.min(last, index + 1))
    else if (event.key === "ArrowUp") setActive((index) => Math.max(0, index - 1))
    else if (event.key === "Home") setActive(0)
    else if (event.key === "End") setActive(last)
    else if (event.key === "Enter" || event.key === " ") choose(active)
    else if (event.key === "Escape") close()
    else if (event.key === "Tab") return close(false)
    else if (event.key.length === 1) {
      const now = Date.now()
      typeahead.current.text = (now - typeahead.current.at < 700 ? typeahead.current.text : "") + event.key.toLowerCase()
      typeahead.current.at = now
      const match = options.findIndex((option) => option.label.toLowerCase().startsWith(typeahead.current.text))
      if (match >= 0) setActive(match)
    } else return
    event.preventDefault()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={props["aria-label"]}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKey}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border bg-surface pr-2 pl-3 text-left text-body-sm text-ink transition-colors duration-150 outline-none disabled:opacity-50",
          open ? "border-primary" : "border-line hover:border-line-strong focus-visible:border-primary",
          className,
        )}
      >
        {selected?.icon}
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <RiArrowDownSLine className={cn("size-4 shrink-0 text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={props["aria-label"]}
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            style={{ left: position.left, width: position.width, top: position.top, bottom: position.bottom, maxHeight: position.maxHeight }}
            className={cn(
              "scroll-thin fixed z-[60] flex animate-fade flex-col gap-px overflow-y-auto rounded-md border border-line bg-surface p-1 outline-none",
              "shadow-[0_10px_30px_-18px_rgb(7_8_12/0.45)]",
            )}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              return (
                <div
                  key={option.value}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={cn(
                    "flex min-h-8 cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-body-sm select-none",
                    index === active ? "bg-hover" : "",
                    isSelected ? "font-medium text-ink" : "text-ink/85",
                  )}
                >
                  {option.icon}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.hint && <span className="truncate text-label-sm font-normal text-muted">{option.hint}</span>}
                  </span>
                  {isSelected && <RiCheckLine className="size-4 shrink-0 text-primary" />}
                </div>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
