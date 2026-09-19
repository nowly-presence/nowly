import { type ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Label } from "@/ui/label"
import { cn } from "@/ui/utils"

// Subset of packages/ui/src/field.tsx - just enough for a settings row
// ("label + description" wrapping a Switch/Checkbox/RadioGroupItem). The
// multi-field form primitives (FieldSet, FieldGroup, FieldError...) aren't
// used anywhere in the extension's single-control settings rows.
const fieldVariants = cva("group/field flex w-full gap-2 data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
      horizontal:
        "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

const Field = ({ className, orientation = "vertical", ...props }: ComponentProps<"div"> & VariantProps<typeof fieldVariants>) => (
  <div role="group" data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} />
)

const FieldContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div data-slot="field-content" className={cn("group/field-content flex flex-1 flex-col gap-0.5 leading-snug", className)} {...props} />
)

const FieldLabel = ({ className, ...props }: ComponentProps<typeof Label>) => (
  <Label
    data-slot="field-label"
    className={cn(
      "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 *:data-[slot=field]:p-2.5 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
      "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
      className,
    )}
    {...props}
  />
)

const FieldTitle = ({ className, ...props }: ComponentProps<"div">) => (
  <div data-slot="field-label" className={cn("flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50", className)} {...props} />
)

const FieldDescription = ({ className, ...props }: ComponentProps<"p">) => (
  <p
    data-slot="field-description"
    className={cn(
      "text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
      "last:mt-0 nth-last-2:-mt-1",
      "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
      className,
    )}
    {...props}
  />
)

export { Field, FieldLabel, FieldContent, FieldTitle, FieldDescription }
