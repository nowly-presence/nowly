"use client";

import type { SubmissionAssets, SubmissionDefinition } from "@/features/account/lib/submission-api";
import { pickText } from "@/features/account/lib/submission-text";
import { Badge, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { useLocale, useTranslations } from "next-intl";

export const SubmissionPreview = ({ definition, assets }: {
  definition: SubmissionDefinition;
  assets: SubmissionAssets;
}) => {
  const t = useTranslations("submissionPage");
  const locale = useLocale();
  const text = (value: Parameters<typeof pickText>[0]) => pickText(value, locale, definition.baseLocale);
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent>
          {assets.thumbnail ? (
            <img src={assets.thumbnail} alt="" width={1920} height={1080} className="aspect-video w-full rounded-xl bg-muted object-cover" />
          ) : null}
          <div className="mt-4 flex items-center gap-4">
            {assets.logo ? <img src={assets.logo} alt="" width={64} height={64} className="size-16 shrink-0 rounded-xl bg-muted object-cover" /> : null}
            {assets.icon ? <img src={assets.icon} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg bg-muted object-contain" /> : null}
            <div className="min-w-0">
              <CardTitle className="truncate text-lg">{definition.name}</CardTitle>
              <CardDescription>{text(definition.description)}</CardDescription>
            </div>
          </div>
          {text(definition.longDescription) ? <p className="mt-4 whitespace-pre-line text-sm text-foreground/80">{text(definition.longDescription)}</p> : null}
          {definition.features.length ? (
            <ul className="mt-4 list-disc pl-5 text-sm text-foreground/80">
              {definition.features.map((feature, index) => (
                <li key={index}>{text(feature)}</li>
              ))}
            </ul>
          ) : null}
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">{t("domains")}</dt>
            <dd className="break-all">{definition.domains.join(", ")}</dd>
            <dt className="text-muted-foreground">{t("category")}</dt>
            <dd>{definition.category}</dd>
            <dt className="text-muted-foreground">{t("color")}</dt>
            <dd className="flex items-center gap-2">
              <span className="size-3 rounded-full border border-border" style={{ backgroundColor: definition.color }} />
              {definition.color}
            </dd>
            <dt className="text-muted-foreground">{t("languages")}</dt>
            <dd>
              {definition.translationMode === "auto"
                ? t("languages-auto", { locale: definition.baseLocale })
                : definition.locales.join(", ")}
            </dd>
            <dt className="text-muted-foreground">{t("author")}</dt>
            <dd>{definition.author.name}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <CardTitle className="text-lg">{t("pages-title", { count: definition.pages.length })}</CardTitle>
          <ul className="mt-4 flex flex-col gap-4">
            {definition.pages.map((page) => (
              <li key={page.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{page.name}</p>
                  <Badge variant="outline">{page.activityType}</Badge>
                </div>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {page.match.mode === "any" ? t("match-any") : `${page.match.mode} ${page.match.path}`}
                </p>
                <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">{text(page.details)}</p>
                  {text(page.state) ? <p className="text-foreground/75">{text(page.state)}</p> : null}
                  {page.button.enabled ? (
                    <p className="mt-2 inline-block rounded-md border border-border px-2 py-0.5 text-xs">{text(page.button.label)}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};