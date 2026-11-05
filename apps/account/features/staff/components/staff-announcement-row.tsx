"use client";

import { announcementStatus, sourceTexts } from "@/features/staff/lib/announcement-draft";
import type { Announcement } from "@nowly/shared/announcements";
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@nowly/ui";
import { RiDeleteBinLine, RiEditLine, RiMoreLine, RiPushpinLine, RiUnpinLine } from "@nowly/ui/icons";
import { useFormatter, useTranslations } from "next-intl";

type Props = {
  item: Announcement;
  now: number;
  busy: boolean;
  onEdit: () => void;
  onTogglePinned: () => void;
  onDelete: () => void;
};

export const StaffAnnouncementRow = ({ item, now, busy, onEdit, onTogglePinned, onDelete }: Props) => {
  const t = useTranslations("staff");
  const format = useFormatter();
  const texts = sourceTexts(item);
  const date = (iso: string): string =>
    format.dateTime(new Date(iso), {
      dateStyle: "medium",
      timeStyle: "short"
    });
  const details = [
    t("announcements-published-on", { date: date(item.publishedAt) }),
    item.startsAt ? t("announcements-starts-on", { date: date(item.startsAt) }) : null,
    item.endsAt ? t("announcements-ends-on", { date: date(item.endsAt) }) : null
  ].filter(Boolean);

  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{texts.title}</span>
          <Badge variant="outline">{t(`announcements-kind-${item.kind}`)}</Badge>
          <Badge variant="outline">{t(`announcements-status-${announcementStatus(item, now)}`)}</Badge>
          {item.pinned ? (
            <Badge variant="outline">
              <RiPushpinLine data-icon="inline-start" />
              {t("announcements-pinned-short")}
            </Badge>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">{texts.description}</p>
        <p className="text-xs text-muted-foreground">{details.join(" / ")}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label={t("announcements-actions")} disabled={busy} />}>
          <RiMoreLine className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onClick={onEdit}>
            <RiEditLine />
            {t("announcements-edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onTogglePinned}>
            {item.pinned ? <RiUnpinLine /> : <RiPushpinLine />}
            {item.pinned ? t("announcements-unpin") : t("announcements-pin")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <RiDeleteBinLine />
            {t("announcements-delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};