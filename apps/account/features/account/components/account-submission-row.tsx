"use client";

import { SubmissionStatusBadge } from "@/features/account/components/submission-status-badge";
import type { QueueItem, SubmissionListItem } from "@/features/account/lib/submission-api";
import { submissionHref } from "@/features/account/lib/submission-text";
import { Link } from "@/i18n/navigation";
import { useFormatter, useTranslations } from "next-intl";

export const AccountSubmissionRow = ({ item }: {
  item: SubmissionListItem | QueueItem;
}) => {
  const t = useTranslations("accountPage");
  const format = useFormatter();
  const author = "author" in item ? item.author?.name : null;
  return (
    <li>
      <Link
        href={submissionHref(item.id)}
        className="flex items-center justify-between gap-4 py-3 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[
              item.kind === "update" ? t("kind-update") : t("kind-create"),
              author ? t("by-author", { name: author }) : null,
              t("revision-label", { number: item.revision }),
              format.dateTime(new Date(item.updatedAt), { dateStyle: "medium" })
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        <SubmissionStatusBadge status={item.status} />
      </Link>
    </li>
  );
};