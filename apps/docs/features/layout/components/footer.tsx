import { BrandLockup } from "@nowly/ui/brand-lockup";
import { ThemeToggle } from "@nowly/ui/theme-toggle";
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