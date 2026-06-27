"use client";

import { IconX } from "@tabler/icons-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-background/70 backdrop-blur-sm",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />

      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 overflow-hidden border-border bg-card text-card-foreground",
          "shadow-2xl outline-none transition ease-in-out",
          "data-open:animate-in data-open:fade-in-0",
          "data-closed:animate-out data-closed:fade-out-0",

          "data-[side=right]:inset-y-3 data-[side=right]:right-3",
          "data-[side=right]:w-[calc(100%-1.5rem)] data-[side=right]:max-w-md",
          "data-[side=right]:rounded-2xl data-[side=right]:border",
          "data-[side=right]:data-open:slide-in-from-right-8",
          "data-[side=right]:data-closed:slide-out-to-right-8",

          "data-[side=left]:inset-y-3 data-[side=left]:left-3",
          "data-[side=left]:w-[calc(100%-1.5rem)] data-[side=left]:max-w-md",
          "data-[side=left]:rounded-2xl data-[side=left]:border",
          "data-[side=left]:data-open:slide-in-from-left-8",
          "data-[side=left]:data-closed:slide-out-to-left-8",

          "data-[side=top]:inset-x-3 data-[side=top]:top-3",
          "data-[side=top]:rounded-2xl data-[side=top]:border",
          "data-[side=top]:data-open:slide-in-from-top-8",
          "data-[side=top]:data-closed:slide-out-to-top-8",

          "data-[side=bottom]:inset-x-3 data-[side=bottom]:bottom-3",
          "data-[side=bottom]:rounded-2xl data-[side=bottom]:border",
          "data-[side=bottom]:data-open:slide-in-from-bottom-8",
          "data-[side=bottom]:data-closed:slide-out-to-bottom-8",

          className
        )}
        {...props}
      >
        {children}

        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-4 top-4 text-muted-foreground"
            >
              <IconX />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2 px-6 pb-2 pt-6", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 px-6 pb-6 pt-2", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-lg font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader, SheetOverlay, SheetPortal, SheetTitle,
  SheetTrigger
};
