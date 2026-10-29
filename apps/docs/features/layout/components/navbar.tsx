"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { BrandLockup } from "@/features/layout/components/brand-lockup";
import { DOCS_URL } from "@/lib/constants";
import { Navbar as SharedNavbar } from "@nowly/ui/navbar";

export const Navbar = () => {
  return (
    <SharedNavbar
      site="docs"
      docsOrigin={DOCS_URL}
      brand={<BrandLockup width={148} height={60} className="h-full w-auto object-contain object-left" />}
      storeButton={<ExtensionStoreButton />}
    />
  );
};