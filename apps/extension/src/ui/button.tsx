import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { cn } from "@/ui/cn"

type Variant = "primary" | "secondary" | "solid" | "ghost" | "danger" | "destructive" | "link" | "inverse"
type Size = "md" | "sm" | "icon" | "icon-sm"

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:brightness-[1.06] active:brightness-95 disabled:opacity-45",
  secondary: "border border-line-strong bg-transparent text-ink hover:bg-hover active:bg-press disabled:opacity-45",
  solid: "border border-ink bg-ink text-canvas hover:opacity-90 active:opacity-80 disabled:opacity-45",
  ghost: "bg-transparent text-ink hover:bg-hover active:bg-press disabled:opacity-45",
  danger: "border border-line-strong bg-transparent text-danger hover:bg-danger-soft disabled:opacity-45",
  destructive: "bg-danger text-white hover:brightness-[1.06] active:brightness-95 disabled:opacity-45",
  link: "h-auto! p-0! rounded-none! text-muted underline underline-offset-4 decoration-line-strong hover:text-ink font-normal! text-body-sm",
  inverse: "bg-on-tertiary text-tertiary hover:opacity-90 disabled:opacity-45",
}

const sizes: Record<Size, string> = {
  md: "h-9 px-3.5 gap-2 text-label-lg",
  sm: "h-8 px-3 gap-1.5 text-label-md",
  icon: "size-9 justify-center",
  "icon-sm": "size-8 justify-center",
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, loading, className, children, disabled, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-[background-color,filter,opacity,color] duration-150 select-none",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  ),
)
Button.displayName = "Button"

export const Spinner = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("size-4 animate-spin", className)} fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)
