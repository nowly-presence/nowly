import { BrandLockup } from "@/features/layout/components/brand-lockup";
import { ThemeToggle } from "@/features/layout/components/theme-toggle";
import { Footer as SharedFooter } from "@nowly/ui/footer";
import { LocaleSelector } from "@nowly/ui/locale-selector";

export const Footer = () => (
  <SharedFooter
    brand={<BrandLockup width={119} height={48} className="h-14 w-auto" />}
    actions={
      <>
        <LocaleSelector />
        <ThemeToggle />
      </>
    }
  />
);