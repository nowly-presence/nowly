import { BrandLockup } from "@/features/layout/components/brand-lockup";
import { FooterActions } from "@/features/layout/components/footer-actions";
import { Footer as SharedFooter } from "@nowly/ui/footer";

export const Footer = () => <SharedFooter brand={<BrandLockup width={119} height={48} className="h-14 w-auto" />} actions={<FooterActions />} />;