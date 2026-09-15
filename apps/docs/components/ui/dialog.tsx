"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> & {
  variant?: "default" | "destructive"
  size?: "default" | "sm"
};

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
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

function DialogContent({
  className,
  variant = "default",
  size = "default",
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-variant={variant}
        data-size={size}
        className={cn(
          "group/dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)]",
          "-translate-x-1/2 -translate-y-1/2 overflow-hidden outline-none",
          "rounded-2xl border border-border/80 bg-card shadow-2xl",
          "data-[size=default]:max-w-[420px] data-[size=sm]:max-w-[360px]",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-2",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:slide-out-to-bottom-2",
          className
        )}
        {...props}
      />
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col items-center gap-3 px-6 pt-7 pb-4 text-center",
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col gap-2 px-6 pb-6 pt-2",
        className
      )}
      {...props}
    />
  );
}

function DialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-media"
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-2xl border",
        "group-data-[variant=destructive]/dialog-content:border-destructive/20 group-data-[variant=destructive]/dialog-content:bg-destructive/10 group-data-[variant=destructive]/dialog-content:text-destructive",
        "group-data-[variant=default]/dialog-content:border-border group-data-[variant=default]/dialog-content:bg-muted/60 group-data-[variant=default]/dialog-content:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-base font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "max-w-[320px] text-sm leading-6 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function DialogAction({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close> & {
  variant?: "default" | "destructive";
}) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-action"
      data-variant={variant}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3",
        "text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        "data-[variant=destructive]:bg-destructive data-[variant=destructive]:text-destructive-foreground data-[variant=destructive]:hover:bg-destructive/90",
        "data-[variant=default]:bg-foreground data-[variant=default]:text-background data-[variant=default]:hover:bg-foreground/90",
        className
      )}
      {...props}
    />
  );
}

function DialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-cancel"
      className={cn(
        "flex w-full cursor-pointer items-center justify-center rounded-xl px-4 py-2.5",
        "text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogAction,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger
};
