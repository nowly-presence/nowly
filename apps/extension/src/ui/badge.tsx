import type { ReactNode } from "react"
import { cn } from "@/ui/cn"

type BadgeTone = "neutral" | "primary" | "success" | "danger" | "outline"

const tones: Record<BadgeTone, string> = {
  neutral: "bg-hover text-muted",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  outline: "border border-line text-muted",
}

export const Badge = ({ tone = "neutral", children, className, icon }: { tone?: BadgeTone; children: ReactNode; className?: string; icon?: ReactNode }) => (
  <span className={cn("inline-flex h-5 items-center gap-1 rounded-full px-2 text-label-sm font-medium whitespace-nowrap", tones[tone], className)}>
    {icon}
    {children}
  </span>
)
