import { type ReactNode } from "react"
import { cn } from "@/ui/cn"

export const SectionHeader = ({ title, action, className }: { title: string; action?: ReactNode; className?: string }) => (
  <div className={cn("flex min-h-7 items-center justify-between gap-3 px-1", className)}>
    <h2 className="text-label-md font-medium text-muted">{title}</h2>
    {action}
  </div>
)

export const Section = ({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={cn("flex flex-col gap-2", className)}>
    {title && <SectionHeader title={title} action={action} />}
    {children}
  </section>
)
