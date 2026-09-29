import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { cn } from "@/ui/cn"
import { fieldBase } from "@/ui/field-styles"

type InputProps = InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, leading, trailing, ...props }, ref) => (
  <div className="relative flex items-center">
    {leading && <span className="pointer-events-none absolute left-3 flex text-muted">{leading}</span>}
    <input ref={ref} className={cn(fieldBase, "h-9 px-3", Boolean(leading) && "pl-9", Boolean(trailing) && "pr-9", className)} {...props} />
    {trailing && <span className="absolute right-2 flex">{trailing}</span>}
  </div>
))
Input.displayName = "Input"
