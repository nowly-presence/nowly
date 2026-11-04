"use client";

import type { SubmissionAssets, SubmissionDefinition, SubmissionPage } from "@/features/account/lib/submission-api";
import { pickText } from "@/features/account/lib/submission-text";
import { Badge, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { RiCheckboxCircleLine } from "@nowly/ui/icons";
import { useLocale, useTranslations } from "next-intl";

const pageButtons = (page: SubmissionPage) => page.buttons ?? (page.button?.enabled ? [{ label: page.button.label }] : []);

export const SubmissionPreview = ({ definition, assets }: {
  definition: SubmissionDefinition;
  assets: SubmissionAssets;
}) => {
  const t = useTranslations("submissionPage");
  const locale = useLocale();
  const text = (value: Parameters<typeof pickText>[0]) => pickText(value, locale, definition.baseLocale);
  const description = text(definition.description);
  const about = text(definition.longDescription);
  const features = definition.features.map(text).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-0 py-0">
        <div className="relative mb-12 sm:mb-14">
          <div className="h-52 overflow-hidden bg-muted sm:h-72">
            {assets.thumbnail ? <img src={assets.thumbnail} alt="" width={1920} height={1080} className="size-full object-cover" /> : null}
          </div>
          <div className="absolute bottom-0 left-6 z-10 translate-y-1/2 sm:left-8">
            {assets.logo ? (
              <img src={assets.logo} alt="" width={96} height={96} className="size-20 rounded-2xl border-4 border-card bg-muted object-cover sm:size-24" />
            ) : (
              <span
                className="flex size-20 items-center justify-center rounded-2xl border-4 border-card text-3xl font-medium text-white sm:size-24"
                style={{ backgroundColor: definition.color }}
              >
                {definition.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <CardContent className="pt-6 pb-8 sm:pt-8">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent">{definition.category}</p>
          <h2 className="mt-2 text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground">{definition.name}</h2>
          {description ? <p className="mt-4 max-w-[46ch] text-[1.05rem] leading-relaxed text-foreground/68">{description}</p> : null}
          {about && about !== description ? (
            <div className="mt-8 border-t border-foreground/8 pt-8">
              <CardTitle>{t("about")}</CardTitle>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{about}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {features.length ? (
        <Card size="sm">
          <CardContent>
            <CardTitle>{t("features")}</CardTitle>
            <ul className="mt-4 flex flex-col gap-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                  <RiCheckboxCircleLine className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card size="sm">
        <CardContent>
          <CardTitle>{t("info")}</CardTitle>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t("domains")}</dt>
            <dd className="break-all">{definition.domains.join(", ")}</dd>
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
                  {pageButtons(page).length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pageButtons(page).map((button, index) => (
                        <span key={index} className="rounded-md border border-border px-2 py-0.5 text-xs">
                          {text(button.label)}
                        </span>
                      ))}
                    </div>
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