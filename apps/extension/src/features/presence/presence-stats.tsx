import { useI18n } from "@/hooks/i18n-provider";
import { formatCompact } from "@/lib/format";
import { Card } from "@/ui/card";

export const PresenceStats = ({ activeUsers, totalInstalls, likes, bare = false }: {
  activeUsers: number;
  totalInstalls: number;
  likes: number;
  bare?: boolean;
}) => {
  const { t, locale } = useI18n();
  const stats = [
    {
      label: t("detail.activeNow"),
      value: activeUsers
    },
    {
      label: t("detail.installs"),
      value: totalInstalls
    },
    {
      label: t("detail.likes"),
      value: likes
    }
  ];
  const cells = stats.map((stat) => (
    <div key={stat.label} className="flex flex-col items-center gap-0.5 px-2 py-3">
      <span className="text-body-md font-medium tabular-nums">{formatCompact(stat.value, locale)}</span>
      <span className="text-label-sm text-muted">{stat.label}</span>
    </div>
  ));

  if (bare) return (
    <div className="grid grid-cols-3 divide-x divide-line">
      {cells}
    </div>
  );

  return (
    <Card className="grid grid-cols-3 divide-x divide-line">
      {cells}
    </Card>
  );
};