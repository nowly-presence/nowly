import { RiArrowRightLine } from "@remixicon/react";
import { selectAnnouncementTranslation } from "@nowly/shared/announcements";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { pinnedAnnouncement } from "@/shared/announcements";
import { cn } from "@/ui/cn";
import { useAnnouncementsClock } from "./announcements-clock";

const warningBackgrounds = {
  1: "bg-announcement-warning-low-soft hover:bg-announcement-warning-low-soft-hover",
  2: "bg-announcement-warning-medium-soft hover:bg-announcement-warning-medium-soft-hover",
  3: "bg-danger-soft hover:bg-danger-soft-hover"
} as const;

export const AnnouncementsBanner = () => {
  const { state } = useExtensionState();
  const { t, locale } = useI18n();
  const { setTab } = useNav();
  const now = useAnnouncementsClock();
  const item = pinnedAnnouncement(state.announcements, now);

  if (!item) return null;

  const text = selectAnnouncementTranslation(item, locale);

  if (!text) return null;

  const backgroundClass =
    item.kind === "maintenance"
      ? "bg-primary-soft hover:bg-primary-soft-hover"
      : item.kind === "warning" && item.severity !== null
        ? warningBackgrounds[item.severity]
        : "bg-surface hover:bg-canvas";

  return (
    <aside aria-label={t("announcements.pinned")} className="shrink-0 text-ink">
      <a
        href="#announcements"
        aria-label={`${text.title}. ${t("nav.announcements")}`}
        onClick={(event) => {
          event.preventDefault();
          setTab("announcements");
        }}
        className={cn(
          "flex min-h-9 w-full items-center justify-center gap-2 border-0 px-4 py-2 text-label-md font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary",
          backgroundClass
        )}
      >
        <span className="min-w-0 truncate">{text.title}</span>
        <RiArrowRightLine aria-hidden className="size-4 shrink-0" />
      </a>
    </aside>
  );
};