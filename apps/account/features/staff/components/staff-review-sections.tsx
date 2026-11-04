"use client";

import type { SubmissionAssets, SubmissionDefinition, SubmissionPage } from "@/features/account/lib/submission-api";
import { pickText } from "@/features/account/lib/submission-text";
import type { ReviewSection } from "@/features/staff/lib/review-sections";
import { Badge } from "@nowly/ui";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

const IMAGE_KEYS = ["thumbnail", "logo", "icon"] as const;

const pageButtons = (page: SubmissionPage) => page.buttons ?? (page.button?.enabled ? [{ label: page.button.label }] : []);

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-foreground">{children}</dd>
  </div>
);

export const StaffReviewSection = ({ section, definition, assets }: {
  section: ReviewSection;
  definition: SubmissionDefinition;
  assets: SubmissionAssets;
}) => {
  const t = useTranslations("staff");
  const locale = useLocale();
  const text = (value: Parameters<typeof pickText>[0]) => pickText(value, locale, definition.baseLocale);

  if (section === "identity") return (
    <dl className="flex flex-col gap-2">
      <Row label={t("f-name")}>{definition.name}</Row>
      <Row label={t("f-category")}>{definition.category}</Row>
      <Row label={t("f-color")}>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full border border-border" style={{ backgroundColor: definition.color }} />
          {definition.color}
        </span>
      </Row>
      <Row label={t("f-author")}>{definition.author.name}</Row>
    </dl>
  );

  if (section === "images") return (
    <ul className="grid grid-cols-3 gap-3">
      {IMAGE_KEYS.map((key) => (
        <li key={key} className="flex flex-col gap-1.5">
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-[10px] bg-foreground/6 ring-1 ring-foreground/10">
            {assets[key] ? <img src={assets[key]} alt="" className="size-full object-cover" /> : <span className="text-xs text-muted-foreground">{t("check-missing")}</span>}
          </div>
          <span className="text-xs text-muted-foreground">{t(`image-${key}`)}</span>
        </li>
      ))}
    </ul>
  );

  if (section === "texts") return (
    <dl className="flex flex-col gap-2">
      <Row label={t("f-description")}>{text(definition.description)}</Row>
      <Row label={t("f-long")}>
        <span className="whitespace-pre-line">{text(definition.longDescription)}</span>
      </Row>
      <Row label={t("f-locales")}>
        <span className="flex flex-wrap gap-1">
          {definition.translationMode === "auto" ? <Badge variant="outline">{t("f-auto")}</Badge> : null}
          {definition.locales.map((entry) => (
            <Badge key={entry} variant="secondary">
              {entry}
            </Badge>
          ))}
        </span>
      </Row>
    </dl>
  );

  if (section === "pages") return (
    <ul className="flex flex-col gap-3">
      {definition.pages.map((page) => (
        <li key={page.id} className="rounded-[10px] bg-foreground/4 p-3 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{page.name}</span>
            <Badge variant="outline">{page.activityType}</Badge>
          </div>
          <p className="mt-1 break-all text-xs text-muted-foreground">{page.match.mode === "any" ? t("f-match-any") : `${page.match.mode} ${page.match.path}`}</p>
          <p className="mt-2 text-sm text-foreground">{text(page.details)}</p>
          {text(page.state) ? <p className="text-sm text-muted-foreground">{text(page.state)}</p> : null}
          {pageButtons(page).length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pageButtons(page).map((button, index) => (
                <Badge key={index} variant="outline">
                  {text(button.label)}
                </Badge>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <ul className="flex flex-wrap gap-1.5">
      {definition.domains.map((domain) => (
        <li key={domain}>
          <Badge variant="secondary">{domain}</Badge>
        </li>
      ))}
    </ul>
  );
};
