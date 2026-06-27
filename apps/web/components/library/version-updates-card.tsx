"use client";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_REPOSITORY_URL } from "@/lib/constants";
import type { Contributor } from "@/lib/data/presences";
import { cn } from "@/lib/utils";
import { IconDownload, IconGitBranch } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useMemo, useState } from "react";
import { GitHubIcon } from "../icons";
import { Badge } from "../ui/badge";

export type VersionUpdate = {
  version: string;
  date: string;
  description: string;
  author?: Contributor;
  contributors?: Contributor[];
  pr?: string;
  source?: "cli" | "pr";
  commitSha?: string;
  bundleSizeLabel?: string;
  versionType?: string;
  aiGeneratedChangelog?: boolean;
  changelog?: string[];
  ctaLabel?: string;
  disabled?: boolean;
};

type VersionUpdatesCardProps = {
  currentVersion: string;
  installedVersion?: string | null;
  accentColor?: string;
  updates: VersionUpdate[];
  className?: string;
  onInstallVersion?: (version: string) => void;
};

const githubUrl = (github: string): string => `https://github.com/${github}`;

const sourceUrl = (update: VersionUpdate): string | undefined => {
  if (update.pr?.startsWith("#")) {
    return `${PROJECT_REPOSITORY_URL}/pull/${update.pr.slice(1)}`;
  }

  if (update.commitSha) {
    return `${PROJECT_REPOSITORY_URL}/commit/${update.commitSha}`;
  }

  return undefined;
};

export const VersionUpdatesCard: FC<VersionUpdatesCardProps> = ({ currentVersion, installedVersion, accentColor, updates, className, onInstallVersion }): ReactElement => {
  const t = useTranslations("version-updates-card");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const sortedUpdates = useMemo(() => updates, [updates]);
  const selectedUpdate = sortedUpdates[selectedIndex];

  if (!selectedUpdate) return <></>;

  const isCurrentVersion = selectedUpdate.version === currentVersion;
  const isInstalledVersion = selectedUpdate.version === installedVersion;
  const shouldShowSelector = sortedUpdates.length > 1;
  const releaseSourceUrl = sourceUrl(selectedUpdate);
  const contributors = selectedUpdate.contributors ?? [];
  const installLabel = isCurrentVersion
    ? t("install-action")
    : t("install-old-action");

  const handleSelectVersion = (version: string): void => {
    const nextIndex = sortedUpdates.findIndex((update) => update.version === version);
    if (nextIndex !== -1) setSelectedIndex(nextIndex);
  };

  return (
    <Card className={cn("space-y-5", className)}>
      <CardHeader>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <CardTitle>{t("version-title", { version: selectedUpdate.version })}</CardTitle>
          {isCurrentVersion && (
            <Badge
              variant="outline"
              style={accentColor
                ? {
                    backgroundColor: `${accentColor}20`,
                    borderColor: `${accentColor}55`,
                    color: accentColor,
                  }
                : undefined}
            >
              {t("current-badge")}
            </Badge>
          )}
          {selectedUpdate.versionType && (
            <Badge variant="outline">{selectedUpdate.versionType}</Badge>
          )}
        </div>

        <CardDescription>{selectedUpdate.date}</CardDescription>

        {onInstallVersion && !isInstalledVersion ? (
          <CardAction>
            <Button
              size="sm"
              variant={isCurrentVersion ? "secondary" : "default"}
              disabled={isCurrentVersion || selectedUpdate.disabled}
              onClick={() => onInstallVersion(selectedUpdate.version)}
            >
              <IconDownload className="size-4" />
              {selectedUpdate.ctaLabel ?? installLabel}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">{selectedUpdate.description}</p>

        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          {selectedUpdate.bundleSizeLabel ? (
            <div className="rounded-md border border-border bg-card-2 px-3 py-2">
              <div className="text-dim-foreground">{t("size-label")}</div>
              <div className="mt-1 font-medium text-foreground">{selectedUpdate.bundleSizeLabel}</div>
            </div>
          ) : null}

          {selectedUpdate.source ? (
            <div className="rounded-md border border-border bg-card-2 px-3 py-2">
              <div className="text-dim-foreground">{t("source-label")}</div>
              <div className="mt-1 font-medium uppercase text-foreground">{selectedUpdate.source}</div>
            </div>
          ) : null}

          {selectedUpdate.commitSha ? (
            <div className="rounded-md border border-border bg-card-2 px-3 py-2">
              <div className="text-dim-foreground">{t("commit-label")}</div>
              <div className="mt-1 font-mono font-medium text-foreground">{selectedUpdate.commitSha.slice(0, 7)}</div>
            </div>
          ) : null}
        </div>

        {(selectedUpdate.author || contributors.length > 0) ? (
          <div className="space-y-2">
            {selectedUpdate.author ? (
              <div className="flex items-center justify-between gap-3 rounded-md bg-card-2 px-3 py-2">
                <span className="text-xs text-dim-foreground">{t("author-label")}</span>
                {selectedUpdate.author.github ? (
                  <a
                    href={githubUrl(selectedUpdate.author.github)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent"
                  >
                    <GitHubIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{selectedUpdate.author.name}</span>
                  </a>
                ) : (
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{selectedUpdate.author.name}</span>
                )}
              </div>
            ) : null}

            {contributors.length > 0 ? (
              <div className="rounded-md bg-card-2 px-3 py-2">
                <div className="mb-2 text-xs text-dim-foreground">{t("contributors-label")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {contributors.map((contributor) => (
                    contributor.github ? (
                      <a
                        key={`${contributor.github}-${contributor.name}`}
                        href={githubUrl(contributor.github)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge variant="outline" className="max-w-36">
                          <GitHubIcon className="size-3" />
                          <span className="truncate">{contributor.name}</span>
                        </Badge>
                      </a>
                    ) : (
                      <Badge key={contributor.name} variant="outline" className="max-w-36">
                        <span className="truncate">{contributor.name}</span>
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {releaseSourceUrl ? (
            <a href={releaseSourceUrl} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline">
                <IconGitBranch className="size-3" />
                {selectedUpdate.pr ?? selectedUpdate.commitSha?.slice(0, 7)}
              </Badge>
            </a>
          ) : null}
        </div>
      </CardContent>

      {shouldShowSelector ? (
        <CardFooter className="flex items-center justify-end">
          <Select
            value={selectedUpdate.version}
            onValueChange={handleSelectVersion}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder={t("version-placeholder")} />
            </SelectTrigger>

            <SelectContent>
              {sortedUpdates.map((update) => (
                <SelectItem key={update.version} value={update.version}>{update.version}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardFooter>
      ) : null}
    </Card>
  );
};
