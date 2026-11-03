"use client";

import type { SubmissionDetail } from "@/features/account/lib/submission-api";
import { Badge, Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { useFormatter, useTranslations } from "next-intl";

type Entry = {
  key: string;
  at: string;
  who: string | null;
  label: string;
  revision: number | null;
  body: string | null;
  comments: Array<{
    field: string;
    page?: string;
    message: string;
  }>;
};

const buildEntries = (detail: SubmissionDetail, labelOf: (type: string) => string): Entry[] => {
  const reviews: Entry[] = detail.reviews.map((review) => ({
    key: `review-${review.id}`,
    at: review.createdAt,
    who: review.reviewer?.name ?? null,
    label: labelOf(`review.${review.verdict}`),
    revision: review.revision,
    body: review.message || null,
    comments: review.comments
  }));
  const events: Entry[] = detail.history
    .filter((event) => !event.type.startsWith("review."))
    .map((event, index) => ({
      key: `event-${index}`,
      at: event.createdAt,
      who: event.actor?.name ?? null,
      label: labelOf(event.type),
      revision: event.revision,
      body: event.note,
      comments: []
    }));
  return [...reviews, ...events].sort((a, b) => a.at.localeCompare(b.at));
};

export const SubmissionThread = ({ detail }: {
  detail: SubmissionDetail;
}) => {
  const t = useTranslations("submissionPage");
  const format = useFormatter();
  const labelOf = (type: string): string => {
    const key = `event-${type.replace(".", "-")}`;
    return t.has(key) ? t(key) : type;
  };
  const entries = buildEntries(detail, labelOf);
  return (
    <Card>
      <CardContent>
        <CardTitle className="text-lg">{t("thread-title")}</CardTitle>
        <CardDescription className="mt-2">{t("thread-description")}</CardDescription>
        {entries.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("thread-empty")}</p> : null}
        <ol className="mt-4 flex flex-col gap-4">
          {entries.map((entry) => (
            <li key={entry.key} className="border-l-2 border-border pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{entry.label}</Badge>
                {entry.revision ? <span className="text-xs text-muted-foreground">{t("revision-heading", { number: entry.revision })}</span> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[
                  entry.who,
                  format.dateTime(new Date(entry.at), {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {entry.body ? <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/85">{entry.body}</p> : null}
              {entry.comments.length ? (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {entry.comments.map((comment, index) => (
                    <li key={index} className="rounded-lg bg-muted px-3 py-2 text-sm">
                      <code className="text-xs text-muted-foreground">{comment.page ? `${comment.field} (${comment.page})` : comment.field}</code>
                      <p className="mt-0.5 whitespace-pre-wrap text-foreground/85">{comment.message}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};