import { RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { CREATOR_STEPS, type CreatorDraft, type CreatorStep } from "@nowly/presence-creator/creator-types";
import { issuesForStep, type CreatorIssue } from "@nowly/presence-creator/creator-validation";
import { Group } from "@/ui/card";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { STEP_META } from "@/features/creator/creator-steps";
import { DraftHero } from "@/features/creator/review/draft-preview";
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
      <DraftHero draft={draft} />

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