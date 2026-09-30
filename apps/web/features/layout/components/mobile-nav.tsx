"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { Link } from "@/i18n/navigation";
import { CANARY_ACCENT, CANARY_INK } from "@/lib/brand";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@nowly/ui/sheet";

type MobileNavProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  links: Array<{ href: string; label: string; external: boolean }>
  canary: boolean
  menuLabel: string
};

export const MobileNav = ({ open, onOpenChange, links, canary, menuLabel }: MobileNavProps) => {
  const storeButtonProps = canary
    ? { className: "border-transparent hover:brightness-110", style: { backgroundColor: CANARY_ACCENT, color: CANARY_INK } }
    : {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(100%,20rem)] bg-background p-0 lg:hidden">
        <SheetHeader>
          <SheetTitle>{menuLabel}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-3 px-4 pb-6">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-foreground"
                onClick={() => onOpenChange(false)}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground"
                onClick={() => onOpenChange(false)}
              >
                {link.label}
              </Link>
            ),
          )}
          <ExtensionStoreButton {...storeButtonProps} />
        </nav>
      </SheetContent>
    </Sheet>
  );
};
