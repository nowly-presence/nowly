import { t } from "@/shared/i18n";
import { IconBrandGithub } from "@/lib/tabler-icons";
import type { FC, ReactElement } from "react";

type Person = {
  github?: string;
  name: string;
};

type Props = {
  author?: Person;
  contributors?: Person[];
};

const PersonRow: FC<{ label?: string; person: Person }> = ({ label, person }): ReactElement => {
  const githubUrl = person.github ? `https://github.com/${person.github}` : null;
  const avatarUrl = person.github ? `https://github.com/${person.github}.png?size=64` : null;
  const initial = person.name.trim().charAt(0).toUpperCase() || "?";

  const content = (
    <>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-8 shrink-0 rounded-full bg-card-2 object-cover" />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card-2 text-xs font-semibold text-foreground">
          {initial}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{person.name}</span>
        {person.github ? (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <IconBrandGithub className="size-3 shrink-0" />
            <span className="truncate">{person.github}</span>
          </span>
        ) : null}
      </span>
      {label ? (
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}
    </>
  );

  const rowClassName = "flex w-full items-center gap-3 bg-card-2 px-3 py-2 text-left first:rounded-t-lg last:rounded-b-lg";

  if (githubUrl) {
    return (
      <button
        type="button"
        onClick={() => void chrome.tabs.create({ url: githubUrl })}
        className={`${rowClassName} transition-colors hover:bg-card-hover`}
      >
        {content}
      </button>
    );
  }

  return <div className={rowClassName}>{content}</div>;
};

export const PresenceCreditsCard: FC<Props> = ({ author, contributors = [] }): ReactElement | null => {
  if (!author?.name) return null;

  const extra = contributors.filter((person) => person.name && person.name !== author.name);
  const authorLabel = extra.length > 0 ? t("presence-author-label") : undefined;

  return (
    <section className="rounded-xl border border-border bg-card px-4 py-3">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("presence-credits")}
      </h2>
      <div className="overflow-hidden rounded-lg">
        <PersonRow person={author} label={authorLabel} />
        {extra.map((person) => (
          <PersonRow
            key={`${person.github ?? person.name}`}
            person={person}
            label={t("presence-contributor-label")}
          />
        ))}
      </div>
    </section>
  );
};
