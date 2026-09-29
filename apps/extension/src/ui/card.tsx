import { type HTMLAttributes } from "react"
import { cn } from "@/ui/cn"

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-sm border border-line bg-surface", className)} {...props} />
)

export const Group = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <Card className={cn("divide-y divide-line overflow-hidden", className)} {...props} />
)
