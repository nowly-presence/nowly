import { Card, CardContent, CardDescription, CardTitle, cn } from "@nowly/ui";
import { StatusHistory } from "@/components/status/status-history";
import { fetchStatusReport, statusBadgeClasses, type ServiceStatus, type StatusServiceId } from "@/features/status/status";
import { RiDatabase2Line, RiGlobalLine, RiPulseLine, RiServerLine } from "@nowly/ui/icons";
import { getLocale, getTranslations } from "next-intl/server";

const serviceIconMap: Record<StatusServiceId, typeof RiGlobalLine> = {
  website: RiGlobalLine,
  api: RiPulseLine,
  library: RiDatabase2Line,
  cdn: RiServerLine,
};

const overallDotClasses: Record<ServiceStatus, string> = {
  operational: "bg-success",
  slow: "bg-warning",
  degraded: "bg-warning",
  down: "bg-destructive",
  unknown: "bg-muted-foreground/40",
};

const formatRelativeTime = (locale: string, generatedAt: string): string => {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffDays > 0) return rtf.format(-diffDays, "day");
  if (diffHours > 0) return rtf.format(-diffHours, "hour");
  if (diffMinutes > 0) return rtf.format(-diffMinutes, "minute");
  return rtf.format(-diffSeconds, "second");
};

export const StatusView = async () => {
  const t = await getTranslations("statusPage");
  const locale = await getLocale();
  const report = await fetchStatusReport();

  const labels: Record<ServiceStatus, string> = {
    operational: t("status-labels.operational"),
    slow: t("status-labels.slow"),
    degraded: t("status-labels.degraded"),
    down: t("status-labels.down"),
    unknown: t("status-labels.unknown"),
  };

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description")}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn("size-2 shrink-0 rounded-full", overallDotClasses[report.overallStatus])} />
            <span>{t(`overall.${report.overallStatus}`)}</span>
            {report.generatedAt ? (
              <span className="text-muted-foreground/60">
                · {t("checked-history", { time: formatRelativeTime(locale, report.generatedAt) })}
              </span>
            ) : null}
          </div>
        </header>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {report.services.map((service) => {
            const Icon = serviceIconMap[service.id];
            const status = service.current?.status ?? "unknown";
            const latency =
              service.current?.responseMs === null || !service.current
                ? null
                : `${service.current.responseMs} ms`;

            return (
              <Card key={service.id}>
                <CardContent className="flex h-full flex-col">
                  <div className="flex size-10 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
                    <Icon className="size-5" />
                  </div>

                  <CardTitle className="mt-4">{t(`services.${service.id}.title`)}</CardTitle>
                  <CardDescription className="mt-1">{latency ?? t("no-data")}</CardDescription>

                  <span
                    className={cn(
                      "mt-4 w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      statusBadgeClasses[status],
                    )}
                  >
                    {labels[status]}
                  </span>

                  <div className="mt-5">
                    <StatusHistory
                      service={service}
                      locale={locale}
                      labels={labels}
                      noData={t("no-data")}
                      historyLabel={t("history-label")}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
