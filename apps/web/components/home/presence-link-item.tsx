import { ASSET_URL } from "@/lib/assets";
import { getLocalizedDescription } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";
import { ArrowUpRight, Download, Users } from "lucide-react";
import Link from "next/link";
import type { FC, ReactElement } from "react";

type Props = {
  presence: Presence
  locale: string
};

export const PresenceLinkItem: FC<Props> = ({ presence, locale }) => {
  const numberFormat = new Intl.NumberFormat(locale);

  return (
    <Link
      href={`/library/${presence.slug}`}
      className="group relative isolate overflow-hidden rounded-lg border border-border bg-card p-5 transition-all hover:bg-card-hover/45"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
        style={{
          background: `radial-gradient(circle at 88% 18%, ${presence.iconColor}, transparent 58%)`,
        }}
      />

      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start gap-4">
          <div
            className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/5"
          >
            <div
              className="absolute inset-0 opacity-15 transition-opacity group-hover:opacity-25"
              style={{ backgroundColor: presence.iconColor }}
            />

            <img
              src={ASSET_URL(presence.slug, "icon")}
              alt={presence.name}
              width={32}
              height={32}
              className="relative size-8 object-contain"
              loading="lazy"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h3 className="truncate font-semibold text-foreground">{presence.name}</h3>
              <ArrowUpRight className="size-4 shrink-0 text-dim-foreground transition-colors group-hover:text-foreground" />
            </div>

            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {getLocalizedDescription(presence, locale)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-dim-foreground">
          <span className="flex items-center gap-1.5">
            <Download className="size-3.5" />
            {numberFormat.format(presence.totalInstalls)}
          </span>

          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {numberFormat.format(presence.activeUsers)}
          </span>
        </div>
      </div>
    </Link>
  );
};

type PresenceItemMoreProps = {
  count: number;
  label: string;
};

export const PresenceItemMore: FC<PresenceItemMoreProps> = ({ count, label }): ReactElement => {
  return (
    <Link
      href="/library"
      className="group relative isolate overflow-hidden rounded-lg border border-dashed border-border bg-card p-5 transition-all hover:bg-card-hover/45"
    >
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex h-full flex-col items-center justify-center text-center">
        <span className="text-5xl font-black tracking-tight text-foreground">
          +{count}
        </span>

        <span className="mt-3 text-sm text-muted-foreground">
          {label}
        </span>
      </div>
    </Link>
  );
};