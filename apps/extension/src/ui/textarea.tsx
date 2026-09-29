import { forwardRef, type TextareaHTMLAttributes } from "react"
import { cn } from "@/ui/cn"
import { fieldBase } from "@/ui/field-styles"

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "min-h-28 resize-none px-3 py-2.5 leading-[21px]", className)} {...props} />
))
Textarea.displayName = "Textarea"
