"use client";

import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { IconCheck, IconSearch } from "@tabler/icons-react";

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full flex-col overflow-hidden bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        size="sm"
        className={cn(
          "top-24 translate-y-0 overflow-hidden p-0",
          "max-w-xl!",
          className
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="border-b border-border p-2"
    >
      <InputGroup
        className="border-border bg-card-2"
      >
        <InputGroupAddon>
          <IconSearch className="size-4 text-muted-foreground" />
        </InputGroupAddon>

        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "flex-1 bg-transparent text-sm outline-none",
            "placeholder:text-muted-foreground",
            "disabled:pointer-events-none",
            "disabled:opacity-50",
            className
          )}
          {...props}
        />
      </InputGroup>
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-80 overflow-y-auto overflow-x-hidden",
        className
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        "py-8 text-center text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-2",
        "[&_[cmdk-group-heading]]:px-2",
        "[&_[cmdk-group-heading]]:pb-2",
        "[&_[cmdk-group-heading]]:pt-1",
        "[&_[cmdk-group-heading]]:text-xs",
        "[&_[cmdk-group-heading]]:font-medium",
        "[&_[cmdk-group-heading]]:uppercase",
        "[&_[cmdk-group-heading]]:tracking-wider",
        "[&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn(
        "mx-2 my-1 h-px bg-border",
        className
      )}
      {...props}
    />
  );
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item flex items-center gap-2",
        "cursor-default select-none",
        "rounded-lg px-3 py-2",
        "text-sm",
        "transition-colors",
        "data-[disabled=true]:pointer-events-none",
        "data-[disabled=true]:opacity-50",
        "data-[selected=true]:bg-card-2",
        "data-[selected=true]:text-foreground",
        "[&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}

      <IconCheck className="ml-auto opacity-0 group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog, CommandEmpty,
  CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut
};

