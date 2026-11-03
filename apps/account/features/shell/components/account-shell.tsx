import { AccountNavbar } from "@/features/shell/components/account-navbar";
import { BrandLockup } from "@/features/shell/components/brand-lockup";
import { Footer } from "@nowly/ui/footer";
import type { PropsWithChildren } from "react";

export const AccountShell = ({ capabilities, children }: PropsWithChildren<{
  capabilities: readonly string[];
}>) => (
  <div className="flex min-h-dvh flex-col">
    <AccountNavbar capabilities={capabilities} />
    <main id="main-content" tabIndex={-1} className="flex-1">
      {children}
    </main>
    <Footer brand={<BrandLockup width={119} height={48} className="h-14 w-auto" />} />
  </div>
);