import { ScreenBody, ScreenTitle } from "@/components/shared/screen";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { sendMessage } from "@/lib/messages";
import { visibleAnnouncements } from "@/shared/announcements";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { cn } from "@/ui/cn";
import { EmptyState } from "@/ui/empty-state";
import { Skeleton } from "@/ui/skeleton";
import { selectAnnouncementTranslation } from "@nowly/shared/announcements";
import { RiArrowRightSLine, RiMegaphoneLine } from "@remixicon/react";
import { useAnnouncementsClock } from "./announcements-clock";

export const AnnouncementsView = () => {
  const { state, patch } = useExtensionState();
  const { t, locale } = useI18n();
  const { push } = useNav();
  const now = useAnnouncementsClock();
  const items = visibleAnnouncements(state.announcements, now);
  const loading = !state.announcements.fetchedAt && !state.announcements.offline;
  const retry = () =>
    void sendMessage("REFRESH_ANNOUNCEMENTS", { locale })
      .then((announcements) => patch({ announcements }))
      .catch(() => {});

  const status = loading
    ? t("announcements.loading")
    : state.announcements.offline
      ? t("announcements.offline")
      : state.announcements.fetchedAt
        ? t("announcements.updated", { date: new Date(state.announcements.fetchedAt).toLocaleString(locale) })
        : "";

  return (
    <ScreenBody className="gap-4">
      <ScreenTitle title={t("nav.announcements")} subtitle={t("announcements.subtitle")} />
      <div className="flex items-center justify-between gap-3">
        <p role={loading || state.announcements.offline ? "status" : undefined} className="text-label-sm text-muted">
          {status}
        </p>

        {state.announcements.offline && (
          <Button size="sm" variant="ghost" onClick={retry}>
            {t("announcements.refresh")}
          </Button>
        )}
      </div>

      {loading && (
        <div aria-busy="true" className="flex flex-col gap-2">
          <Skeleton className="h-22 rounded-[14px]" />
          <Skeleton className="h-22 rounded-[14px]" />
          <Skeleton className="h-22 rounded-[14px]" />
        </div>
      )}

      {!loading && !items.length && <EmptyState title={t("announcements.empty")} description={t("announcements.emptyHint")} />}

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const text = selectAnnouncementTranslation(item, locale);

            if (!text) return null;

            const date = new Date(item.publishedAt).toLocaleString(locale, {
              dateStyle: "medium",
              timeStyle: "short"
            });
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  push({
                    name: "announcement",
                    id: item.id
                  })
                }
                className="group w-full text-left"
              >
                <Card className={cn("flex items-start gap-3 rounded-[14px] p-3 transition-colors", "hover:bg-hover active:bg-press")}>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-hover text-ink">
                        <RiMegaphoneLine className="size-4" />
                      </span>
                      <time dateTime={item.publishedAt} className="text-label-sm text-muted">
                        {date}
                      </time>
                      <RiArrowRightSLine className="ml-auto size-4 shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5" />
                    </div>

                    <h3 className="line-clamp-2 text-body font-medium text-ink">{text.title}</h3>
                    <p className="line-clamp-2 text-body-sm text-muted">{text.description}</p>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </ScreenBody>
  );
};