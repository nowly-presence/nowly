import { Button } from "@/components/ui/button";
import { docsHref } from "@/lib/seo";
import { PROJECT_NEW_PRESENCE_URL } from "@/lib/constants";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

type Props = {
  showLead?: boolean;
};

export const PresenceContributeLinks: FC<Props> = ({ showLead = true }): ReactElement => {
  const t = useTranslations("marketplace-page");

  return (
    <div className="flex flex-col items-center gap-3">
      {showLead ? (
        <p className="text-sm text-muted-foreground">{t("contribute-lead")}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={PROJECT_NEW_PRESENCE_URL} target="_blank" rel="noopener noreferrer">
            {t("request-presence")}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={docsHref("/docs/presence-development/creating-your-first-presence")}>
            {t("create-presence")}
          </Link>
        </Button>
      </div>
    </div>
  );
};
