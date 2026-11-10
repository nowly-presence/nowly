"use client";

import { Frame } from "@/features/shell/components/frame";
import type { SubmissionRevisionSummary } from "@/features/account/lib/submission-api";
import { Badge } from "@nowly/ui";
import { useFormatter, useTranslations } from "next-intl";

export const SubmissionChanges = ({ revisions }: {
  revisions: SubmissionRevisionSummary[];
}) => {
  const t = useTranslations("submissionPage");
  const format = useFormatter();
  const ordered = [...revisions].reverse();
  return (
    <Frame title={t("changes-title")} description={t("changes-description")}>
      <ol className="flex flex-col gap-5">
        {ordered.map((revision) => (
          <li key={revision.number}>
            <p className="text-sm font-medium text-foreground">
              {t("revision-heading", { number: revision.number })}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {format.dateTime(new Date(revision.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </span>
            </p>
            {revision.changes.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{t("changes-none")}</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {revision.changes.map((change, index) => (
                  <li key={`${change.field}-${change.page ?? ""}-${index}`} className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant={change.kind === "removed" ? "destructive" : change.kind === "added" ? "default" : "secondary"}>
                      {t(`change-${change.kind}`)}
                    </Badge>
                    <code className="text-foreground/80">{change.field}</code>
                    {change.page ? <span className="text-muted-foreground">{t("change-page", { name: change.page })}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </Frame>
  );
};