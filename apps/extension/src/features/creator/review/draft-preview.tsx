import { useI18n } from "@/hooks/i18n-provider";
import { categoryKey } from "@/lib/presence-categories";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";
import { DotSeparator } from "@/ui/dot-separator";

const LOGO_SIZE = 60;

export const DraftBanner = ({ draft, className }: { draft: CreatorDraft; className: string }) =>
  draft.assets.thumbnail ? (
    <img src={draft.assets.thumbnail} alt="" className={className} />
  ) : (
    <div className={className} style={{ background: `radial-gradient(120% 90% at 20% 10%, ${draft.color}66 0%, transparent 60%), var(--tertiary)` }} />
  );

export const DraftLogo = ({ draft, size, rounded }: {
  draft: CreatorDraft;
  size: number;
  rounded: string;
}) => {
  const name = draft.name.trim();

  return draft.assets.logo ? (
    <img
      src={draft.assets.logo}
      alt=""
      style={{
        width: size,
        height: size
      }}
      className={`shrink-0 bg-hover object-cover ${rounded}`}
    />
  ) : (
    <span
      style={{
        width: size,
        height: size,
        backgroundColor: draft.color,
        fontSize: Math.round(size * 0.42)
      }}
      className={`flex shrink-0 items-center justify-center font-medium text-white ${rounded}`}
    >
      {name.slice(0, 1).toUpperCase() || "?"}
    </span>
  );
};

export const DraftHero = ({ draft }: {
  draft: CreatorDraft;
}) => {
  const { t } = useI18n();
  const name = draft.name.trim() || t("creator.untitled");

  return (
    <div className="flex flex-col">
      <DraftBanner draft={draft} className="aspect-[16/9] w-full rounded-lg bg-tertiary object-cover" />
      <div className="relative -mt-10 flex items-end gap-1.5 px-3">
        <div className="shrink-0 rounded-[14px] bg-canvas p-1">
          <DraftLogo draft={draft} size={LOGO_SIZE} rounded="rounded-[10px]" />
        </div>
        <div className="mb-2 min-w-0 rounded-[12px] bg-canvas px-3 py-1.5">
          <h1 className="truncate text-headline-sm font-medium tracking-[-0.3px]">{name}</h1>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-label-md text-muted">
        {draft.author.name && (
          <>
            <span>
              {t("detail.by")} {draft.author.name}
            </span>
            <DotSeparator />
          </>
        )}
        <span>{t(categoryKey(draft.category))}</span>
      </div>
    </div>
  );
};