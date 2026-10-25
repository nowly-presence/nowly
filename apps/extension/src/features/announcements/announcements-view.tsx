import { selectAnnouncementTranslation } from "@nowly/shared/announcements";
import { ScreenBody, ScreenTitle } from "@/components/shared/screen";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { sendMessage } from "@/lib/messages";
import { visibleAnnouncements } from "@/shared/announcements";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { EmptyState } from "@/ui/empty-state";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { Skeleton } from "@/ui/skeleton";
import { AnnouncementsMeta } from "./announcements-meta";
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
    <ScreenBody>
      <ScreenTitle title={t("nav.announcements")} subtitle={t("announcements.subtitle")} />
      <Section>
        <div className="flex items-start justify-between gap-3 px-1">
          <p role={loading || state.announcements.offline ? "status" : undefined} className="text-label-sm text-muted">
            {status}
          </p>
          {state.announcements.offline && (
            <Button variant="link" onClick={retry}>
              {t("announcements.refresh")}
            </Button>
          )}
        </div>
        {loading && (
          <div aria-busy="true" className="flex flex-col gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        )}
        {!loading && !items.length && <EmptyState title={t("announcements.empty")} description={t("announcements.emptyHint")} />}
        {items.length > 0 && (
          <Group>
            {items.map((item) => {
              const text = selectAnnouncementTranslation(item, locale);

              if (!text) return null;

              return (
                <Row
                  key={item.id}
                  align="start"
                  title={<span className="whitespace-normal">{text.title}</span>}
                  description={
                    <span className="flex flex-col gap-2">
                      <span>{text.description}</span>
                      <AnnouncementsMeta item={item} />
                    </span>
                  }
                  onClick={() =>
                    push({
                      name: "announcement",
                      id: item.id
                    })
                  }
                  chevron
                />
              );
            })}
          </Group>
        )}
      </Section>
    </ScreenBody>
  );
};