import { docsHref } from "@/lib/seo";
import { PROJECT_NEW_PRESENCE_URL } from "@/lib/constants";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

type Props = {
  className?: string;
};

export const PresenceContributeLinks: FC<Props> = ({ className }): ReactElement => {
  const t = useTranslations("marketplace-page");

  return (
    <p className={className ?? "text-sm text-muted-foreground"}>
      {t("contribute-lead")}{" "}
      <Link
        href={PROJECT_NEW_PRESENCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline"
      >
        {t("request-presence")}
      </Link>
      {" · "}
      <Link href={docsHref("/docs/presence-development/creating-your-first-presence")} className="text-accent hover:underline">
        {t("create-presence")}
      </Link>
    </p>
  );
};
