import { WEB_BASE_URL } from "@/shared/constants";
import { t } from "@/shared/i18n";
import { IconExternalLink } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";

export const MarketplaceLink: FC = (): ReactElement => (
  <a
    href={`${WEB_BASE_URL}/library`}
    target="_blank"
    rel="noreferrer"
    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
  >
    {t("marketplace")}
    <IconExternalLink className="h-3.5 w-3.5" />
  </a>
);