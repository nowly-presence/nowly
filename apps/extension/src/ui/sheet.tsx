import { useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { RiCloseLine } from "@remixicon/react"
import { cn } from "@/ui/cn"

type SheetProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  closeLabel: string
}

export const Sheet = ({ open, onClose, title, description, children, footer, closeLabel }: SheetProps) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label={closeLabel} onClick={onClose} className="absolute inset-0 animate-fade bg-overlay/60 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex max-h-[88vh] w-full max-w-lg animate-enter-up flex-col rounded-t-xl border-t border-line bg-surface outline-none"
      >
        <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-body-md font-medium text-ink">{title}</h2>
            {description && <p className="text-body-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mt-1 -mr-1 flex size-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink"
          >
            <RiCloseLine className="size-5" />
          </button>
        </div>
        {children && <div className="scroll-thin overflow-y-auto px-4 pb-4">{children}</div>}
        {footer && <div className={cn("flex gap-2 border-t border-line px-4 py-3")}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
