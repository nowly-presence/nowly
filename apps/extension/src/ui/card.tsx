import * as React from "react"
import { cn } from "@/ui/utils"

const Card = ({ className, size = "default", ...props }: React.ComponentProps<"div"> & { size?: "default" | "sm" }) => (
  <div
    data-slot="card"
    data-size={size}
    className={cn(
      "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-[16px] bg-foreground/[0.04] py-(--card-spacing) text-sm text-foreground shadow-[0_0_0_1px_rgba(228,242,255,0.06)] [--card-spacing:--spacing(6)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-[16px] *:[img:last-child]:rounded-b-[16px]",
      className,
    )}
    {...props}
  />
)

const CardHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="card-header"
    className={cn(
      "group/card-header @container/card-header grid auto-rows-min items-start gap-2 rounded-t-[16px] px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
      className,
    )}
    {...props}
  />
)

const CardTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="card-title"
    className={cn("font-heading text-base leading-snug font-medium text-foreground group-data-[size=sm]/card:text-sm", className)}
    {...props}
  />
)

const CardDescription = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="card-description"
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
)

const CardAction = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="card-action"
    className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
    {...props}
  />
)

const CardContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="card-content"
    className={cn("px-(--card-spacing)", className)}
    {...props}
  />
)

const CardFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="card-footer"
    className={cn("flex items-center rounded-b-[16px] border-t border-foreground/10 bg-muted/50 p-(--card-spacing)", className)}
    {...props}
  />
)

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
