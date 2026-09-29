import { RiHeart3Fill, RiHeart3Line } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import { formatCompact } from "@/lib/format"

export const PresenceLikeButton = ({ liked, likes, onToggle }: { liked: boolean; likes: number; onToggle: () => void }) => {
  const { t, locale } = useI18n()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={liked}
      aria-label={liked ? t("detail.unlike") : t("detail.like")}
      className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-label-md font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
    >
      {liked ? <RiHeart3Fill className="size-[18px] text-danger" /> : <RiHeart3Line className="size-[18px]" />}
      <span className="tabular-nums">{formatCompact(likes, locale)}</span>
    </button>
  )
}
