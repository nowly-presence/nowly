"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const InputGroupContext = React.createContext<{
  size?: "sm" | "default" | "lg";
}>({
  size: "default",
});

function InputGroup({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "sm" | "default" | "lg";
}) {
  return (
    <InputGroupContext.Provider value={{ size }}>
      <div
        data-slot="input-group"
        data-size={size}
        role="group"
        className={cn(
          "group/input-group relative flex w-full min-w-0 items-center",

          "border border-border",
          "bg-card",

          "transition-all duration-200",
          "outline-none",

          "data-[size=sm]:h-8",
          "data-[size=default]:h-10",
          "data-[size=lg]:h-12",

          "data-[size=sm]:rounded-lg",
          "data-[size=default]:rounded-xl",
          "data-[size=lg]:rounded-xl",

          "has-[>textarea]:h-auto",

          "hover:border-border-light",

          "has-[[data-slot=input-group-control]:focus-visible]:border-accent",
          "has-[[data-slot=input-group-control]:focus-visible]:ring-2",
          "has-[[data-slot=input-group-control]:focus-visible]:ring-accent/20",

          "has-[[data-slot][aria-invalid=true]]:border-destructive",
          "has-[[data-slot][aria-invalid=true]]:ring-2",
          "has-[[data-slot][aria-invalid=true]]:ring-destructive/20",

          className
        )}
        {...props}
      />
    </InputGroupContext.Provider>
  );
}

const inputGroupAddonVariants = cva(
  [
    "flex items-center justify-center gap-2",
    "text-sm font-medium text-muted-foreground",
    "select-none shrink-0",
    "[&>svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      align: {
        "inline-start": "pl-4",
        "inline-end": "pr-4",
        "block-start": "w-full justify-start border-b border-border px-4 py-3",
        "block-end": "w-full justify-start border-t border-border px-4 py-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
);

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva("shadow-none", {
  variants: {
    size: {
      xs: "h-7",
      sm: "h-8",
      "icon-xs": "size-7",
      "icon-sm": "size-8",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
}

function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const { size } = React.useContext(InputGroupContext);

  return (
    <Input
      data-slot="input-group-control"
      _size={size}
      className={cn(
        "h-full flex-1 rounded-none border-0 bg-transparent shadow-none",
        "focus:border-transparent focus:ring-0",
        className
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "min-h-24 flex-1 resize-none rounded-none border-0 bg-transparent px-4 py-3 shadow-none",
        "focus:border-transparent focus:ring-0",
        className
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea
};
