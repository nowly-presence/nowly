import { t } from "@/shared/i18n";
import type { FC, ReactElement } from "react";

type Props = {
  version: string;
};

export const VersionBadge: FC<Props> = ({ version }): ReactElement => (
  <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-border bg-card-2 px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
    {t("version", { version })}
  </span>
);
