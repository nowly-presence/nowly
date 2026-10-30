import { useState, type ReactNode } from "react";
import { RiExternalLinkLine, RiPauseFill } from "@remixicon/react";
import { assetUrl } from "@/shared/presence-assets";
import type { PresencePayload } from "@/shared/types";
import { cn } from "@/ui/cn";
import { formatClock, toMs } from "@/lib/format";
import { useNow } from "@/hooks/use-now";
import type { Translate } from "@/hooks/i18n-provider";
import { LiveDot } from "@/ui/live-dot";
import { PresenceIcon } from "@/components/shared/presence-icon";

type LiveCardProps = {
  slug: string;
  presence: PresencePayload;
  presenceName: string;
  t: Translate;
  status?: "live" | "paused" | "held";
  statusLabel?: string;
  footer?: ReactNode;
  onOpen?: () => void;
  compact?: boolean;
  artwork?: ReactNode;
  className?: string;
  timelineMode?: "playback" | "countdown";
};

const NAMED_HEADER_TYPES = new Set([2, 3, 5]);

const headerKey = (type: number | undefined) =>
  type === 2 ? "activity.header.listening" : type === 3 ? "activity.header.watching" : type === 5 ? "activity.header.competing" : "activity.header.playing";

const typeKey = (type: number | undefined) => (type === 2 ? "activity.type.listening" : type === 3 ? "activity.type.watching" : "activity.type.competing");

const imageSrc = (value: string | undefined, slug: string): string => (value && value.startsWith("https://") ? value : assetUrl(slug, "logo"));

const ActivityImage = ({ src, small, slug, name, size }: {
  src: string;
  small?: string;
  slug: string;
  name: string;
  size: number;
}) => {
  const [failed, setFailed] = useState(false);

  if (slug.startsWith("__")) return <PresenceIcon slug={slug} name={name} size={size} rounded="rounded-md" color="#4a5560" />;

  return (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size
      }}
    >
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
  );
};

export const LiveCard =
  ({ slug, presence, presenceName, t, status = "live", statusLabel, footer, onOpen, compact, artwork, className, timelineMode = "playback" }: LiveCardProps) => {
    const start = toMs(presence.startTime);
    const end = toMs(presence.endTime);
    const now = useNow(1000, status === "live" && Boolean(start || end));
    const elapsed = start ? (now - start) / 1000 : undefined;
    const total = start && end ? (end - start) / 1000 : undefined;
    const progress =
      total && elapsed !== undefined ? Math.min(1, Math.max(0, timelineMode === "countdown" ? 1 - elapsed / total : elapsed / total)) : undefined;
    const remaining = end && !start ? (end - now) / 1000 : undefined;
    const small = presence.smallImage?.startsWith("https://") ? presence.smallImage : undefined;
    const displayName = presence.name || presenceName;
    const namedHeader = NAMED_HEADER_TYPES.has(presence.type ?? 0);
    const detailsPresent = Boolean(presence.details?.trim());
    const statePresent = Boolean(presence.state?.trim());
    const hasTextLine = detailsPresent || statePresent;
    const lines = (
      namedHeader && hasTextLine ? [presence.details, presence.state] : namedHeader ? [displayName] : [displayName, presence.details, presence.state]
    ).filter((line): line is string => Boolean(line));
    if (lines.length === 0) lines.push(displayName);

    return (
      <div className={cn("relative", className)}>
        <article
          className={cn(
            "relative z-10 flex flex-col gap-3 overflow-hidden rounded-lg border border-tertiary-edge bg-tertiary text-on-tertiary",
            compact ? "p-3" : "p-4"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-label-md font-medium text-on-tertiary-muted">
              {status === "live" ? <LiveDot /> : <RiPauseFill className="size-3.5" />}
              <span className="truncate">
                {statusLabel ??
                  (namedHeader && !hasTextLine
                    ? t(typeKey(presence.type))
                    : t(headerKey(presence.type), { name: displayName }))}
              </span>
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
            {artwork ?? (
              <ActivityImage
                src={imageSrc(presence.largeImage, slug)}
                small={small}
                slug={slug}
                name={presence.name || presenceName}
                size={compact ? 48 : 64}
              />
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              {lines.map((line, index) => (
                <span
                  key={index}
                  className={cn(
                    "truncate",
                    index === 0
                      ? "text-label-lg font-medium"
                      : index === 1 && lines.length === 3
                        ? "text-body-sm text-on-tertiary/90"
                        : "text-body-sm text-on-tertiary-muted"
                  )}
                >
                  {line}
                </span>
              ))}
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
                <span>
                  {timelineMode === "countdown"
                    ? formatClock(Math.max(0, total - elapsed))
                    : formatClock(Math.min(elapsed, total))}
                </span>
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
    );
  };