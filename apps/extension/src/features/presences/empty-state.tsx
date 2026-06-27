import { t } from "@/shared/i18n";
import { IconPackage } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { MarketplaceLink } from "@/features/presences/marketplace-link";

export const EmptyState: FC = (): ReactElement => (
  <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-card-2 text-dim-foreground">
      <IconPackage className="h-5 w-5" />
    </div>
    <p className="text-sm font-semibold">{t("empty-title")}</p>
    <p className="mx-auto mt-1 max-w-60 text-xs leading-5 text-muted-foreground">{t("empty-description")}</p>
    <div className="mt-4 flex justify-center">
      <MarketplaceLink />
    </div>
  </section>
);