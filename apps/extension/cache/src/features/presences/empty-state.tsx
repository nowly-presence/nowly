import { t } from "@/shared/i18n";
import { IconPackage } from "@/lib/tabler-icons";
import type { FC, ReactElement } from "react";

type Props = {
  description?: string;
  title?: string;
};

export const EmptyState: FC<Props> = ({ description, title }): ReactElement => (
  <section className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-card-2 text-dim-foreground">
      <IconPackage className="h-5 w-5" />
    </div>
    <p className="text-sm font-semibold">{title ?? t("empty-title")}</p>
    <p className="mx-auto mt-1 max-w-60 text-xs leading-5 text-muted-foreground">
      {description ?? t("empty-description")}
    </p>
  </section>
);
