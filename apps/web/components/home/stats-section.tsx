import { Skeleton } from "@/components/ui/skeleton";
import { Download, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ComponentType, FC, ReactElement } from "react";
import type { HomeStats } from "@/hooks/use-home-stats";

type StatKey = "total-users" | "installed-presences";

type StatItem = {
  icon: ComponentType<{ className?: string }>
  key: StatKey
  value?: number
};

type Props = {
  stats: HomeStats | null
  isError: boolean
};

const StatValue: FC<{ value?: number; loading: boolean; formatter: Intl.NumberFormat }> = ({ value, loading, formatter }) => {
  if (loading) return <Skeleton className="h-9 w-24" />;

  return (
    <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
      {typeof value === "number" ? formatter.format(value) : "-"}
    </span>
  );
};

export const StatsSection: FC<Props> = ({ stats, isError }): ReactElement => {
  const t = useTranslations("stats-section");
  const locale = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale);

  const items: StatItem[] = [
    { key: "total-users", icon: Users, value: stats?.totalUsers },
    { key: "installed-presences", icon: Download, value: stats?.installedPresenceCount },
  ];

  return (
    <section className="border-b border-border py-20">
      <div className="relative z-2 mx-auto w-full max-w-300 min-w-0 px-6">
        <div className="mb-10">
          <span className="mb-4 block text-xs font-bold uppercase tracking-widest text-accent">
            {t("section-label")}
          </span>
          <h2 className="mb-4 text-balance text-[2.5rem]">
            {t("title")}
          </h2>
          <p className="text-balance text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="mx-auto grid min-w-0 gap-4 sm:grid-cols-2 max-w-lg">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.key} className="min-w-0 rounded-xl border border-border bg-card p-5">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <span className="rounded-lg border border-accent/20 bg-accent/10 p-2 text-accent">
                    <Icon className="size-4" />
                  </span>
                </div>

                <div className="space-y-2">
                  <StatValue value={item.value} loading={!stats} formatter={numberFormatter} />
                  <h3 className="text-sm font-semibold text-foreground">{t(`items.${item.key}.label`)}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{t(`items.${item.key}.description`)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-sm text-dim-foreground">
          {isError ? t("unavailable") : t("footnote")}
        </p>
      </div>
    </section>
  );
};
