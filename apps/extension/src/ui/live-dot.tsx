import { cn } from "@/ui/cn"

export const LiveDot = ({ className, pulse = true }: { className?: string; pulse?: boolean }) => (
  <span className={cn("inline-block size-1.5 shrink-0 rounded-full bg-success", pulse && "animate-live", className)} aria-hidden />
)
