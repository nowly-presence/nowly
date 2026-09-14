"use client";

import { type VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import * as React from "react";

import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
});

function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  spacing = 2,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit items-center",
        "gap-[--spacing(var(--gap))]",
        "rounded-xl",
        "data-[orientation=horizontal]:flex-row",
        "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
        "data-[spacing=0]:overflow-hidden data-[spacing=0]:border data-[spacing=0]:border-border",
        "data-[spacing=0]:bg-card",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{
          variant,
          size,
          spacing,
          orientation,
        }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  const computedVariant = context.variant || variant;
  const computedSize = context.size || size;

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={computedVariant}
      data-size={computedSize}
      data-spacing={context.spacing}
      data-orientation={context.orientation}
      className={cn(
        "shrink-0 focus:z-10 focus-visible:z-10",
        toggleVariants({
          variant: computedVariant,
          size: computedSize,
        }),

        "group-data-[spacing=0]/toggle-group:rounded-none",
        "group-data-[spacing=0]/toggle-group:border-0",
        "group-data-[spacing=0]/toggle-group:shadow-none",

        "group-data-[orientation=horizontal]/toggle-group:group-data-[spacing=0]/toggle-group:first:rounded-l-xl",
        "group-data-[orientation=horizontal]/toggle-group:group-data-[spacing=0]/toggle-group:last:rounded-r-xl",

        "group-data-[orientation=vertical]/toggle-group:group-data-[spacing=0]/toggle-group:first:rounded-t-xl",
        "group-data-[orientation=vertical]/toggle-group:group-data-[spacing=0]/toggle-group:last:rounded-b-xl",

        "group-data-[orientation=horizontal]/toggle-group:group-data-[spacing=0]/toggle-group:not(:first-child):border-l",
        "group-data-[orientation=horizontal]/toggle-group:group-data-[spacing=0]/toggle-group:not(:first-child):border-border",

        "group-data-[orientation=vertical]/toggle-group:group-data-[spacing=0]/toggle-group:not(:first-child):border-t",
        "group-data-[orientation=vertical]/toggle-group:group-data-[spacing=0]/toggle-group:not(:first-child):border-border",

        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
