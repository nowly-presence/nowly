import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"
import { cn } from "@/ui/utils"

// Mirrors ui/dropdown-menu.tsx but opens on right click / long press instead
// of a trigger element. Same reduced subset - extend as needed.
const ContextMenu = ({ ...props }: ContextMenuPrimitive.Root.Props) => (
  <ContextMenuPrimitive.Root
    data-slot="context-menu"
    {...props}
  />
)

const ContextMenuTrigger = ({ ...props }: ContextMenuPrimitive.Trigger.Props) => (
  <ContextMenuPrimitive.Trigger
    data-slot="context-menu-trigger"
    {...props}
  />
)

const ContextMenuContent = ({ className, ...props }: ContextMenuPrimitive.Popup.Props) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Positioner className="isolate z-50 outline-none">
      <ContextMenuPrimitive.Popup
        data-slot="context-menu-content"
        className={cn(
          "z-50 max-h-(--available-height) min-w-40 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Positioner>
  </ContextMenuPrimitive.Portal>
)

const ContextMenuItem = ({
  className,
  variant = "default",
  ...props
}: ContextMenuPrimitive.Item.Props & { variant?: "default" | "destructive" }) => (
  <ContextMenuPrimitive.Item
    data-slot="context-menu-item"
    data-variant={variant}
    className={cn(
      "group/context-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
      className,
    )}
    {...props}
  />
)

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem }
