import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { buttonVariants, type ButtonVariantProps } from "@/ui/button-variants"
import { cn } from "@/ui/utils"

const Button = ({ className, variant = "default", size = "default", ...props }: ButtonPrimitive.Props & ButtonVariantProps) => (
  <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
)

export { Button }
