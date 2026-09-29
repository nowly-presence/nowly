import { cn } from "@/ui/cn"

export const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded-sm bg-hover", className)} />
