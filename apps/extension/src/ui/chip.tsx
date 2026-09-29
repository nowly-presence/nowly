import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/ui/cn"

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; icon?: ReactNode }

export const Chip = ({ active, icon, className, children, type = "button", ...props }: ChipProps) => (
  <button
    type={type}
    aria-pressed={active}
    className={cn(
      "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-label-md font-medium whitespace-nowrap transition-colors duration-150",
      active ? "border-transparent bg-ink text-canvas" : "border-line bg-surface text-ink hover:border-line-strong",
      className,
    )}
    {...props}
  >
    {icon}
    {children}
  </button>
)
