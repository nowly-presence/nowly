"use client";

import { Frame } from "@/features/shell/components/frame";
import { AccountSubmissionRow } from "@/features/account/components/account-submission-row";
import type { SubmissionListItem } from "@/features/account/lib/submission-api";
import { useTranslations } from "next-intl";

export const AccountCreationsTab = ({ creations }: {
  creations: SubmissionListItem[];
}) => {
  const t = useTranslations("accountPage");
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Frame title={t("creations-title")} description={t("creations-description")} padded={false}>
        {creations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("creations-empty")}</p>
        ) : (
          <ul className="divide-y divide-border px-4">
            {creations.map((item) => (
              <AccountSubmissionRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </Frame>
    </div>
  );
};