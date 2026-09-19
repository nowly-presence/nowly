import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

export type ButtonVariant = "primary" | "ghost" | "outline" | "subtle" | "danger" | "unstyled";
export type ButtonSize = "sm" | "md" | "icon" | "none";

const BASE = "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "rounded-md bg-accent text-background hover:bg-accent/90",
  ghost: "rounded-md text-muted-foreground hover:bg-card-2 hover:text-foreground",
  outline: "rounded-md border border-border bg-card text-foreground hover:bg-card-2",
  subtle: "rounded-md bg-card-2 text-foreground hover:bg-card-hover",
  danger: "rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300",
  unstyled: "",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-7 px-2 text-xs",
  md: "h-9 px-3 text-sm",
  icon: "h-8 w-8",
  none: "",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Centralized button. `variant="unstyled"` (with `size="none"`) applies no base
 * styling, letting a fully custom `className` reproduce a bespoke look while
 * still routing through the shared component.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, type, children, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(variant === "unstyled" ? undefined : BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = "Button";