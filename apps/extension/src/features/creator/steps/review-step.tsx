import { RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { categoryKey } from "@/lib/presence-categories";
import { CREATOR_STEPS, type CreatorDraft, type CreatorStep } from "@nowly/presence-creator/creator-types";
import { issuesForStep, type CreatorIssue } from "@nowly/presence-creator/creator-validation";
import { Card, Group } from "@/ui/card";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { STEP_META } from "@/features/creator/creator-steps";
import { GeneratedFiles } from "@/features/creator/review/generated-files";
import { SubmitPanel } from "@/features/creator/review/submit-panel";
import type { DraftUpdate } from "@/features/creator/use-draft-editor";

type ReviewStepProps = {
  draft: CreatorDraft;
  update: DraftUpdate;
  issues: CreatorIssue[];
  onGoTo: (step: CreatorStep) => void;
};

export const ReviewStep = ({ draft, update, issues, onGoTo }: ReviewStepProps) => {
  const { t } = useI18n();
  const steps = CREATOR_STEPS.filter((step) => step !== "review");

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden">
        {draft.assets.thumbnail && <img src={draft.assets.thumbnail} alt="" className="aspect-video w-full object-cover" />}
        <div className="flex items-center gap-3 p-4">
          {draft.assets.icon && (
            <img src={draft.assets.icon} alt="" className="size-11 rounded-md object-contain p-1.5" style={{ backgroundColor: draft.color }} />
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-body-lg font-medium">{draft.name.trim() || t("creator.untitled")}</span>
            <span className="truncate text-label-md text-muted">
              {t(categoryKey(draft.category))}
              {draft.domains.length > 0 && `, ${draft.domains.join(", ")}`}
            </span>
          </div>
        </div>
      </Card>

      <Section title={t("creator.review.summary")}>
        <Group>
          {steps.map((step) => {
            const count = issuesForStep(issues, step).length;
            return (
              <Row
                key={step}
                leading={<span className="flex size-8 items-center justify-center rounded-md bg-hover text-muted [&>svg]:size-4">{STEP_META[step].icon}</span>}
                title={t(STEP_META[step].title)}
                description={
                  count > 0 ? (
                    <span className="flex items-center gap-1 text-danger">
                      <RiErrorWarningFill className="size-3.5" />
                      {t("creator.review.toFix", { count })}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-success">
                      <RiCheckboxCircleFill className="size-3.5" />
                      {t("creator.review.complete")}
                    </span>
                  )
                }
                trailing={<span className="text-label-md font-medium text-primary">{t("creator.review.edit")}</span>}
                onClick={() => onGoTo(step)}
              />
            );
          })}
        </Group>
      </Section>

      <SubmitPanel draft={draft} update={update} blocked={issues.length > 0} />

      <GeneratedFiles draft={draft} blocked={issues.length > 0} />
    </div>
  );
};