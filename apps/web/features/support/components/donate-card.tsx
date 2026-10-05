import { Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { ButtonAnchor } from "@nowly/ui/button-link";
import { RiArrowRightUpLine, RiCupLine, RiGithubLine, RiHeart3Line } from "@nowly/ui/icons";
import { getTranslations } from "next-intl/server";

import { SUPPORT_LINKS } from "@/features/support/lib/support-links";

const donateLinks = [
  { href: SUPPORT_LINKS.kofi, label: "Ko-fi", icon: RiCupLine },
  { href: SUPPORT_LINKS.sponsors, label: "GitHub Sponsors", icon: RiGithubLine },
];

export const DonateCard = async () => {
  const t = await getTranslations("supportPage.donate");

  return (
    <Card id="donate" className="mt-16 scroll-mt-28">
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <RiHeart3Line className="size-5 text-accent" />
          <CardTitle className="mt-4 text-lg">{t("title")}</CardTitle>
          <CardDescription className="mt-2">{t("description")}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {donateLinks.map((link) => {
            const Icon = link.icon;
            return (
              <ButtonAnchor key={link.label} href={link.href} rel="noreferrer" target="_blank" variant="outline" size="lg">
                <Icon data-icon="inline-start" />
                {link.label}
                <RiArrowRightUpLine data-icon="inline-end" />
              </ButtonAnchor>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
