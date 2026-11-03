"use client";

import { AccountSubmissionRow } from "@/features/account/components/account-submission-row";
import type { SubmissionListItem } from "@/features/account/lib/submission-api";
import { Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { useTranslations } from "next-intl";

export const AccountCreationsTab = ({ creations }: {
  creations: SubmissionListItem[];
}) => {
  const t = useTranslations("accountPage");
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Card>
        <CardContent>
          <CardTitle className="text-lg">{t("creations-title")}</CardTitle>
          <CardDescription className="mt-2">{t("creations-description")}</CardDescription>
          {creations.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("creations-empty")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {creations.map((item) => (
                <AccountSubmissionRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};