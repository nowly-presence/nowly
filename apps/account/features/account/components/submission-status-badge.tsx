"use client";

import type { SubmissionStatus } from "@/features/account/lib/submission-api";
import { statusVariant } from "@/features/account/lib/submission-text";
import { Badge } from "@nowly/ui";
import { useTranslations } from "next-intl";

export const SubmissionStatusBadge = ({ status }: {
  status: SubmissionStatus;
}) => {
  const t = useTranslations("accountPage");
  return (
    <Badge variant={statusVariant(status)}>
      {t(`status-${status}`)}
    </Badge>
  );
};