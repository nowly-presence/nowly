import { BackHeader, ScreenBody, ScreenTitle } from "@/components/shared/screen";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { sendMessage } from "@/lib/messages";
import { visibleAnnouncements } from "@/shared/announcements";
import { EmptyState } from "@/ui/empty-state";
import { selectAnnouncementTranslation } from "@nowly/shared/announcements";
import { useEffect } from "react";
import { useAnnouncementsClock } from "./announcements-clock";
import { AnnouncementsMarkdown } from "./announcements-markdown";
import { AnnouncementsMeta } from "./announcements-meta";

export const AnnouncementsDetailView = ({ id }: {
  id: string;
}) => {
  const { state } = useExtensionState();
  const { t, locale } = useI18n();
  const { pop } = useNav();

  const now = useAnnouncementsClock();
  const item = visibleAnnouncements(state.announcements, now).find((item) => item.id === id);
  const text = item ? selectAnnouncementTranslation(item, locale) : null;

  useEffect(() => {
    if (item) void sendMessage("MARK_ANNOUNCEMENT", {
      id,
      action: "read"
    }).catch(() => {});
  }, [id, item?.updatedAt]);

  return (
    <>
      <BackHeader title={t("nav.announcements")} backLabel={t("action.back")} onBack={pop} />

      <ScreenBody>
        {item && text ? (
          <article className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <ScreenTitle title={text.title} subtitle={text.description} />
              <AnnouncementsMeta item={item} detail />
            </div>

            {state.announcements.offline && <p className="text-body-sm text-muted">{t("announcements.offline")}</p>}
            <AnnouncementsMarkdown content={text.content} />
          </article>
        ) : (
          <EmptyState title={t("announcements.unavailable")} description={t("announcements.unavailableHint")} />
        )}
      </ScreenBody>
    </>
  );
};