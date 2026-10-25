import type { Announcement } from "@nowly/shared/announcements";
import { useI18n } from "@/hooks/i18n-provider";

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
    <span className="flex flex-col gap-1 text-label-sm font-normal text-muted" style={detail ? { fontSize: "calc(var(--text-label-sm) - 2px)" } : undefined}>
      <time dateTime={item.publishedAt}>{date(item.publishedAt)}</time>
      {item.startsAt && <time dateTime={item.startsAt}>{t("announcements.started", { date: date(item.startsAt) })}</time>}
      {item.endsAt && <time dateTime={item.endsAt}>{t("announcements.estimatedEnd", { date: date(item.endsAt) })}</time>}
      {item.expiresAt && <time dateTime={item.expiresAt}>{t("announcements.expires", { date: date(item.expiresAt) })}</time>}
    </span>
  );
};