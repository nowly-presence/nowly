"use client";

import type { LocalizedText, SubmissionPage } from "@/features/account/lib/submission-api";
import { conditionAction, conditionRule } from "@/features/account/lib/submission-text";
import { useTranslations } from "next-intl";

export const SubmissionConditions = ({ page, text }: {
  page: SubmissionPage;
  text: (value: LocalizedText) => string;
}) => {
  const t = useTranslations("submissionPage");

  if (!page.conditions?.length) return null;

  return (
    <div className="mt-3 text-xs">
      <p className="font-medium text-foreground">{t("conditions")}</p>
      <ol className="mt-1 flex list-decimal flex-col gap-2 pl-4 text-muted-foreground">
        {page.conditions.map((condition) => (
          <li key={condition.id} className="break-all">
            <p className="font-mono text-foreground">{conditionRule(page, condition)}</p>
            <ul className="list-disc pl-4">
              {condition.actions.map((action) => (
                <li key={action.id}>{conditionAction(page, action, text)}</li>
              ))}
            </ul>
            {condition.elseActions.length > 0 ? (
              <>
                <p className="mt-1">{t("conditions-else")}</p>
                <ul className="list-disc pl-4">
                  {condition.elseActions.map((action) => (
                    <li key={action.id}>{conditionAction(page, action, text)}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
};