import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { RiCheckLine, RiErrorWarningLine, RiInformationLine } from "@remixicon/react"
import { cn } from "@/ui/cn"

type ToastTone = "success" | "error" | "info"
type Toast = { id: number; message: string; tone: ToastTone; action?: { label: string; onClick: () => void } }

type ToastValue = { toast: (message: string, tone?: ToastTone, action?: Toast["action"]) => void }

const ToastContext = createContext<ToastValue | null>(null)

const icons = {
  success: <RiCheckLine className="size-4 text-success" />,
  error: <RiErrorWarningLine className="size-4 text-danger" />,
  info: <RiInformationLine className="size-4 text-tertiary-accent" />,
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const toast = useCallback<ToastValue["toast"]>((message, tone = "success", action) => {
    const id = nextId.current++
    setToasts((current) => [...current.slice(-2), { id, message, tone, action }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), action ? 5200 : 3200)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[84px] z-40 flex flex-col items-center gap-2 px-4">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex max-w-full animate-enter-up items-center gap-2.5 rounded-md border border-tertiary-edge bg-tertiary py-2 pr-2 pl-3 text-on-tertiary",
            )}
          >
            {icons[item.tone]}
            <span className="truncate text-label-lg font-medium">{item.message}</span>
            {item.action && (
              <button
                type="button"
                onClick={item.action.onClick}
                className="ml-1 rounded-sm px-2 py-1 text-label-md font-medium text-tertiary-accent hover:bg-tertiary-line"
              >
                {item.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastValue => {
  const value = useContext(ToastContext)
  if (!value) throw new Error("useToast must be used inside <ToastProvider>")
  return value
}
