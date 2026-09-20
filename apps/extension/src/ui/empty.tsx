import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/ui/utils"

const Empty = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-slot="empty" className={cn("flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border-dashed p-6 text-center text-balance", className)} {...props} />
)

const EmptyHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-slot="empty-header" className={cn("flex max-w-sm flex-col items-center gap-2", className)} {...props} />
)

const emptyMediaVariants = cva("mb-1 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0", {
  variants: {
    variant: {
      default: "bg-transparent",
      // bg-secondary (translucent overlay), not bg-muted: Empty is always nested
      // inside a bg-card container here, and --muted equals --card in tokens.css,
      // which made the icon plate invisible against its own background.
      icon: "flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground [&_svg:not([class*='size-'])]:size-6",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const EmptyMedia = ({ className, variant = "default", ...props }: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) => (
  <div data-slot="empty-icon" data-variant={variant} className={cn(emptyMediaVariants({ variant, className }))} {...props} />
)

const EmptyTitle = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-slot="empty-title" className={cn("font-heading text-sm font-medium tracking-tight", className)} {...props} />
)

const EmptyDescription = ({ className, ...props }: React.ComponentProps<"p">) => (
  <div data-slot="empty-description" className={cn("-mt-1 text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary", className)} {...props} />
)

const EmptyContent = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-slot="empty-content" className={cn("flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-sm text-balance", className)} {...props} />
)

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia }
