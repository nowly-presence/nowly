import { useLayoutEffect, useRef, type ReactNode } from "react"
import { cn } from "@/ui/cn"
import { type Tab } from "@/hooks/navigation-provider"

export const Layer = ({ active, children, className, tab }: { active: boolean; children: ReactNode; className?: string; tab?: Tab }) => {
  const ref = useRef<HTMLDivElement>(null)
  const saved = useRef(0)
  const activeRef = useRef(active)
  activeRef.current = active

  useLayoutEffect(() => {
    if (active && ref.current) ref.current.scrollTop = saved.current
  }, [active])

  return (
    <div
      ref={ref}
      data-tab={tab}
      inert={!active}
      aria-hidden={!active}
      onScroll={() => {
        if (activeRef.current && ref.current) saved.current = ref.current.scrollTop
      }}
      className={cn("scroll-thin absolute inset-0 overflow-y-auto", active ? "visible z-10" : "invisible z-0", className)}
    >
      {children}
    </div>
  )
}
