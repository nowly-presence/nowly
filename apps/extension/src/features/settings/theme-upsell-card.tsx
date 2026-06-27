import { IconPalette } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { WEB_BASE_URL } from "@/shared/constants";
import { t } from "@/shared/i18n";

const SUPPORT_REDEEM_URL = `${WEB_BASE_URL.replace(/\/$/, "")}/support/redeem`;

const THEME_SWATCHES = ["#FEE961", "#DA47D0", "#A78BFA", "#4ADE80", "#FB923C"];

export const ThemeUpsellCard: FC = (): ReactElement => (
  <a
    href={SUPPORT_REDEEM_URL}
    target="_blank"
    rel="noreferrer"
    aria-label={t("theme-upsell-title")}
    className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-border-light hover:bg-card-hover"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-card-2 text-foreground">
      <IconPalette className="h-6 w-6" strokeWidth={2.2} />
    </span>

    <span className="min-w-0 flex-1">
      <span className="block text-xs font-semibold leading-4 text-foreground">{t("theme-upsell-title")}</span>
      <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{t("theme-upsell-description")}</span>
    </span>

    <span className="flex shrink-0 -space-x-1" aria-hidden="true">
      {THEME_SWATCHES.map((color) => (
        <span
          key={color}
          className="h-4 w-4 rounded-full ring-2 ring-card group-hover:ring-card-hover"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  </a>
);
