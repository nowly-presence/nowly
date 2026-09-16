import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  presenceSiteHref,
  authorHref,
  type LibraryPresence,
  type PresencePerson,
} from "@/lib/library-catalog";
import type { PresenceCommit } from "@/lib/presence-api";
import { RiGithubLine } from "@remixicon/react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const githubAvatar = (github: string): string =>
  `https://github.com/${encodeURIComponent(github)}.png?size=80`;

const githubProfile = (github: string): string =>
  `https://github.com/${encodeURIComponent(github)}`;

const PersonRow = ({ person, label }: { person: PresencePerson; label: string }) => (
  <div className="flex items-center gap-3">
    <Avatar size="sm">
      {person.github ? <AvatarImage src={githubAvatar(person.github)} alt={person.name} /> : null}
      <AvatarFallback>{person.name.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
    <div className="min-w-0 flex-1">
      {person.github ? (
        <Link href={authorHref(person.github)} className="block truncate text-sm font-medium text-foreground hover:underline">
          {person.name}
        </Link>
      ) : (
        <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
      )}
      <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
    {person.github ? (
      <ButtonAnchor
        href={githubProfile(person.github)}
        rel="noreferrer"
        target="_blank"
        variant="ghost"
        size="icon-sm"
        aria-label={person.github}
      >
        <RiGithubLine />
      </ButtonAnchor>
    ) : null}
  </div>
);

export const PresenceInfo = async ({
  presence,
  commit,
}: {
  presence: LibraryPresence
  commit: PresenceCommit | null
}) => {
  const t = await getTranslations("presencePage");
  const people = [presence.author, ...presence.contributors];

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <CardTitle>{t("contributors")}</CardTitle>
          {people.map((person, index) => (
            <PersonRow
              key={`${person.name}-${person.github ?? index}`}
              person={person}
              label={index === 0 ? t("author") : t("contributor")}
            />
          ))}
        </CardContent>
      </Card>

      {presence.urls.length > 0 ? (
        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            <CardTitle>{t("supported-urls")}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {presence.urls.map((url) => (
                <a
                  key={url}
                  href={presenceSiteHref(url)}
                  rel="noreferrer"
                  target="_blank"
                  className="max-w-full truncate rounded-lg bg-foreground/5 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
                >
                  {url}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {presence.version ? (
        <Card size="sm">
          <CardContent>
            <CardTitle>{t("version")}</CardTitle>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-sm text-muted-foreground">{presence.version}</p>
              {commit ? (
                <ButtonAnchor
                  href={commit.href}
                  rel="noreferrer"
                  target="_blank"
                  variant="ghost"
                  size="sm"
                  className="font-mono"
                  aria-label={t("commit", { sha: commit.shortSha })}
                >
                  <RiGithubLine data-icon="inline-start" />
                  {commit.shortSha}
                </ButtonAnchor>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
