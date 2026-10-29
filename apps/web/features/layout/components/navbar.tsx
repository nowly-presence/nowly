"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { BrandLockup } from "@/features/layout/components/brand-lockup";
import { DOCS_ORIGIN } from "@/features/seo/lib/seo";
import { usePathname } from "@/i18n/navigation";
import { CANARY_ACCENT, CANARY_INK } from "@/lib/brand";
import { Navbar as SharedNavbar } from "@nowly/ui/navbar";

export const Navbar = () => {
  const canary = usePathname() === "/canary";

  return (
    <SharedNavbar
      site="web"
      docsOrigin={DOCS_ORIGIN}
      brand={<BrandLockup width={148} height={60} className="h-full w-auto object-contain object-left" />}
      storeButton={
        <ExtensionStoreButton
          {...(canary
            ? {
                className: "border-transparent hover:brightness-110",
                style: {
                  backgroundColor: CANARY_ACCENT,
                  color: CANARY_INK
                }
              }
            : {})}
        />
      }
    />
  );
};