import { cn } from "@/ui/cn"

export const DotSeparator = ({ className }: { className?: string }) => (
  <span className={cn("inline-block size-[3px] shrink-0 rounded-full bg-line-strong", className)} aria-hidden />
)
