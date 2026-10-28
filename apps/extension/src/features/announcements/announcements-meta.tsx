import { useI18n } from "@/hooks/i18n-provider";
import type { Announcement } from "@nowly/shared/announcements";

export const AnnouncementsMeta = ({ item, detail = false }: {
  item: Announcement;
  detail?: boolean;
}) => {
  const { t, locale } = useI18n();
  const date = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short"
    });

  return (
    <span
      className={
        detail ? "flex flex-col gap-1 text-body font-normal text-muted" : "flex flex-row flex-wrap items-center gap-1 text-label-sm font-normal text-muted"
      }
    >
      <time dateTime={item.publishedAt}>{date(item.publishedAt)}</time>
      {item.startsAt && <time dateTime={item.startsAt}>{t("announcements.started", { date: date(item.startsAt) })}</time>}
      {item.endsAt && <time dateTime={item.endsAt}>{t("announcements.estimatedEnd", { date: date(item.endsAt) })}</time>}
      {item.expiresAt && <time dateTime={item.expiresAt}>{t("announcements.expires", { date: date(item.expiresAt) })}</time>}
    </span>
  );
};