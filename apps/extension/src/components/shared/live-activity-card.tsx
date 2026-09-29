import { useState, type ReactNode } from "react"
import { RiExternalLinkLine, RiPauseFill } from "@remixicon/react"
import { assetUrl } from "@/shared/presence-assets"
import type { PresencePayload } from "@/shared/types"
import { cn } from "@/ui/cn"
import { formatClock, toMs } from "@/lib/format"
import { useNow } from "@/hooks/use-now"
import type { Translate } from "@/hooks/i18n-provider"
import { LiveDot } from "@/ui/live-dot"
import { PresenceIcon } from "@/components/shared/presence-icon"

type LiveCardProps = {
  slug: string
  presence: PresencePayload
  presenceName: string
  t: Translate
  status?: "live" | "paused" | "held"
  statusLabel?: string
  stackDepth?: number
  footer?: ReactNode
  onOpen?: () => void
  compact?: boolean
  className?: string
}

const typeKey = (type: number | undefined) =>
  type === 2 ? "activity.type.listening" : type === 3 ? "activity.type.watching" : type === 5 ? "activity.type.competing" : "activity.type.playing"

const imageSrc = (value: string | undefined, slug: string): string =>
  value && value.startsWith("https://") ? value : assetUrl(slug, "logo")

const ActivityImage = ({ src, small, slug, name, size }: { src: string; small?: string; slug: string; name: string; size: number }) => {
  const [failed, setFailed] = useState(false)
  if (slug.startsWith("__")) return <PresenceIcon slug={slug} name={name} size={size} rounded="rounded-md" color="#4a5560" />
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <img
        src={failed ? assetUrl(slug, "logo") : src}
        onError={() => setFailed(true)}
        alt=""
        draggable={false}
        className="size-full rounded-md bg-tertiary-line object-cover"
      />
      {small && (
        <img
          src={small}
          alt=""
          draggable={false}
          onError={(event) => (event.currentTarget.style.display = "none")}
          className="absolute -right-1 -bottom-1 size-5 rounded-full border-2 border-tertiary bg-tertiary object-cover"
        />
      )}
    </div>
  )
}

export const LiveCard = ({
  slug,
  presence,
  presenceName,
  t,
  status = "live",
  statusLabel,
  stackDepth = 0,
  footer,
  onOpen,
  compact,
  className,
}: LiveCardProps) => {
  const start = toMs(presence.startTime)
  const end = toMs(presence.endTime)
  const now = useNow(1000, status === "live" && Boolean(start || end))
  const elapsed = start ? (now - start) / 1000 : undefined
  const total = start && end ? (end - start) / 1000 : undefined
  const progress = total && elapsed !== undefined ? Math.min(1, Math.max(0, elapsed / total)) : undefined
  const remaining = end && !start ? (end - now) / 1000 : undefined
  const small = presence.smallImage?.startsWith("https://") ? presence.smallImage : undefined
  const layers = Math.min(2, stackDepth)

  return (
    <div className={cn("relative", layers === 1 && "pb-2", layers === 2 && "pb-4", className)}>
      {Array.from({ length: layers }, (_, index) => layers - 1 - index).map((depth) => (
        <div
          key={depth}
          aria-hidden
          className="absolute inset-x-0 rounded-lg border border-tertiary-edge bg-tertiary"
          style={{
            top: (depth + 1) * 8,
            bottom: (layers - 1 - depth) * 8,
            transform: `scale(${1 - (depth + 1) * 0.045})`,
            opacity: depth === 0 ? 0.42 : 0.18,
          }}
        />
      ))}
      <article
        className={cn(
          "relative z-10 flex flex-col gap-3 overflow-hidden rounded-lg border border-tertiary-edge bg-tertiary text-on-tertiary",
          compact ? "p-3" : "p-4",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-label-md font-medium text-on-tertiary-muted">
            {status === "live" ? <LiveDot /> : <RiPauseFill className="size-3.5" />}
            <span className="truncate">{statusLabel ?? t(typeKey(presence.type))}</span>
          </span>
          {status === "live" && elapsed !== undefined && !total && (
            <span className="text-label-md text-on-tertiary-muted tabular-nums">{formatClock(elapsed)}</span>
          )}
          {status === "live" && remaining !== undefined && (
            <span className="text-label-md text-on-tertiary-muted tabular-nums">-{formatClock(remaining)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className="-m-1 flex items-center gap-3 rounded-md p-1 text-left transition-colors enabled:hover:bg-tertiary-line"
        >
          <ActivityImage src={imageSrc(presence.largeImage, slug)} small={small} slug={slug} name={presence.name || presenceName} size={compact ? 48 : 64} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label-lg font-medium">{presence.name || presenceName}</span>
            {presence.details && <span className="truncate text-body-sm text-on-tertiary/90">{presence.details}</span>}
            {presence.state && <span className="truncate text-body-sm text-on-tertiary-muted">{presence.state}</span>}
          </span>
        </button>

        {progress !== undefined && elapsed !== undefined && total !== undefined && (
          <div className="flex flex-col gap-1.5">
            <div className="h-1 overflow-hidden rounded-full bg-tertiary-line">
              <div
                className={cn("h-full rounded-full bg-tertiary-accent transition-[width] duration-1000 ease-linear", status !== "live" && "opacity-50")}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-label-sm text-on-tertiary-muted tabular-nums">
              <span>{formatClock(Math.min(elapsed, total))}</span>
              <span>{formatClock(total)}</span>
            </div>
          </div>
        )}

        {!compact && presence.buttons && presence.buttons.length > 0 && (
          <div className="flex gap-2">
            {presence.buttons.map((button) => (
              <a
                key={button.url}
                href={button.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-tertiary-line px-3 text-label-md font-medium text-on-tertiary transition-colors hover:bg-tertiary-line"
              >
                <span className="truncate">{button.label}</span>
                <RiExternalLinkLine className="size-3.5 shrink-0 opacity-60" />
              </a>
            ))}
          </div>
        )}

        {footer && <div className="-mx-4 -mb-4 border-t border-tertiary-line px-4 py-2.5">{footer}</div>}
      </article>
    </div>
  )
}
