import { useMemo, useState } from "react";
import { RiArrowLeftLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { writtenLocales } from "@/shared/creator/creator-files";
import { CREATOR_STEPS, type CreatorDraft, type CreatorStep } from "@/shared/creator/creator-types";
import { issuesForStep, validateDraft } from "@/shared/creator/creator-validation";
import { Button } from "@/ui/button";
import { StepLayout } from "@/ui/step-layout";
import { StepProgress } from "@/ui/step-progress";
import { CreatorIssueList } from "@/features/creator/creator-issue-list";
import { STEP_META } from "@/features/creator/creator-steps";
import { useDraftEditor } from "@/features/creator/use-draft-editor";
import { IdentityStep } from "@/features/creator/steps/identity-step";
import { LanguageStep } from "@/features/creator/steps/language-step";
import { PagesStep } from "@/features/creator/steps/pages-step";
import { ReviewStep } from "@/features/creator/steps/review-step";
import { TextsStep } from "@/features/creator/steps/texts-step";
import { VisualsStep } from "@/features/creator/steps/visuals-step";

type CreatorWizardProps = {
  initial: CreatorDraft;
  takenSlugs: ReadonlySet<string>;
  persist: (draft: CreatorDraft) => Promise<void>;
  onExit: () => void;
};

export const CreatorWizard = ({ initial, takenSlugs, persist, onExit }: CreatorWizardProps) => {
  const { t } = useI18n();
  const { draft, update } = useDraftEditor(initial, persist);
  const index = CREATOR_STEPS.indexOf(draft.step);
  const issues = useMemo(() => validateDraft(draft, takenSlugs), [draft, takenSlugs]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const editingPage = draft.step === "pages" ? draft.pages.find((page) => page.id === editingPageId) : undefined;
  const stepIssues = issuesForStep(issues, draft.step).filter((issue) => !editingPage || issue.page === editingPage.name);

  const meta = STEP_META[draft.step];
  const goTo = (step: CreatorStep) => {
    setEditingPageId(null);
    update({ step });
  };
  const back = () => (editingPage ? setEditingPageId(null) : index === 0 ? onExit() : goTo(CREATOR_STEPS[index - 1]));
  const next = () => goTo(CREATOR_STEPS[Math.min(CREATOR_STEPS.length - 1, index + 1)]);
  const props = { draft, update };
  const showLanguage = writtenLocales(draft).length > 1;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 bg-canvas/90 px-2 backdrop-blur-md">
        <button
          type="button"
          onClick={back}
          aria-label={editingPage ? t("creator.page.backToList") : index === 0 ? t("creator.backHome") : t("creator.previousStep")}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-md pr-2.5 pl-1.5 text-label-lg font-medium text-ink hover:bg-hover"
        >
          <RiArrowLeftLine className="size-5" />
          {t("action.back")}
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-label-lg font-medium">{draft.name.trim() || t("creator.untitled")}</span>
        <span className="pr-2">
          <StepProgress
            total={CREATOR_STEPS.length}
            current={index}
            label={t("creator.progress", {
              step: index + 1,
              total: CREATOR_STEPS.length
            })}
          />
        </span>
      </header>

      <div key={draft.step} className="flex flex-1 animate-push flex-col px-4">
        <StepLayout
          icon={meta.icon}
          title={t(meta.title)}
          description={t(meta.description)}
          footer={
            <>
              {draft.step !== "review" && <CreatorIssueList issues={stepIssues} showLanguage={showLanguage} />}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={onExit}>
                  {t("creator.later")}
                </Button>
                {editingPage ? (
                  <Button className="flex-1" onClick={() => setEditingPageId(null)}>
                    {t("creator.page.save")}
                  </Button>
                ) : (
                  draft.step !== "review" && (
                    <Button className="flex-1" onClick={next} disabled={stepIssues.length > 0}>
                      {t("creator.nextStep")}
                    </Button>
                  )
                )}
              </div>
            </>
          }
        >
          {draft.step === "visuals" && <VisualsStep {...props} />}
          {draft.step === "identity" && <IdentityStep {...props} />}
          {draft.step === "language" && <LanguageStep {...props} />}
          {draft.step === "texts" && <TextsStep {...props} />}
          {draft.step === "pages" && <PagesStep {...props} editingId={editingPage?.id ?? null} onEdit={setEditingPageId} />}
          {draft.step === "review" && <ReviewStep {...props} issues={issues} onGoTo={goTo} />}
        </StepLayout>
      </div>
    </div>
  );
};