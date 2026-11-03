import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/ui/cn";
import { fieldAria, useFieldIds } from "@/ui/field";
import { fieldBase } from "@/ui/field-styles";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  const field = useFieldIds();
  return <textarea ref={ref} className={cn(fieldBase, "min-h-28 resize-none px-3 py-2.5 leading-[21px]", className)} {...props} {...fieldAria(field, props)} />;
});

Textarea.displayName = "Textarea";