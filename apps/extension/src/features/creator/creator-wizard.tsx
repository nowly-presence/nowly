import { useMemo, useState } from "react";
import { RiArrowLeftLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { writtenLocales } from "@nowly/presence-creator/creator-files";
import { CREATOR_STEPS, type CreatorDraft, type CreatorStep } from "@nowly/presence-creator/creator-types";
import { issuesForStep, validateDraft } from "@nowly/presence-creator/creator-validation";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";
import { StepLayout } from "@/ui/step-layout";
import { CreatorIssueList } from "@/features/creator/creator-issue-list";
import { CreatorStepSheet } from "@/features/creator/creator-step-sheet";
import { STEP_META } from "@/features/creator/creator-steps";
import { useDraftEditor } from "@/features/creator/use-draft-editor";
import { usePageStaging } from "@/features/creator/use-page-staging";
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
  const { draft: saved, update: commit } = useDraftEditor(initial, persist);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const staging = usePageStaging({
    saved,
    commit,
    editing: editingPageId !== null
  });
  const { draft, update, dirty } = staging;
  const index = CREATOR_STEPS.indexOf(draft.step);
  const issues = useMemo(() => validateDraft(draft, takenSlugs), [draft, takenSlugs]);
  const editingPage = draft.step === "pages" ? draft.pages.find((page) => page.id === editingPageId) : undefined;
  const stepIssues = issuesForStep(issues, draft.step).filter((issue) => !editingPage || issue.page === editingPage.name);

  const meta = STEP_META[draft.step];
  const closeEditor = () => {
    staging.discard();
    setEditingPageId(null);
  };
  const leave = (action: () => void) => (dirty ? setPendingLeave(() => action) : action());
  const goTo = (step: CreatorStep) => {
    closeEditor();
    commit({ step });
  };
  const openPage = (id: string) => {
    staging.discard();
    commit({ step: "pages" });
    setEditingPageId(id);
  };
  const back = () => leave(editingPage ? closeEditor : index === 0 ? onExit : () => goTo(CREATOR_STEPS[index - 1]));
  const next = () => {
    staging.save();
    goTo(CREATOR_STEPS[Math.min(CREATOR_STEPS.length - 1, index + 1)]);
  };
  const saveAndLeave = () => {
    const action = pendingLeave;
    staging.save();
    setPendingLeave(null);
    setEditingPageId(null);
    action?.();
  };
  const discardAndLeave = () => {
    const action = pendingLeave;
    setPendingLeave(null);
    staging.discard();
    action?.();
  };
  const props = { draft, update };
  const showLanguage = writtenLocales(draft).length > 1;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 bg-canvas/90 px-2 backdrop-blur-md">
        <button
          type="button"
          onClick={back}
          aria-label={editingPage ? t("creator.page.backToList") : index === 0 ? t("creator.backHome") : t("creator.previousStep")}
          className="flex h-9 w-fit items-center gap-1.5 rounded-md pr-2.5 pl-1.5 text-label-lg font-medium text-ink hover:bg-hover"
        >
          <RiArrowLeftLine className="size-5" />
          {t("action.back")}
        </button>
        <CreatorStepSheet
          draft={draft}
          issues={issues}
          current={draft.step}
          onGoToStep={(step) => leave(() => goTo(step))}
          onOpenPage={(id) => leave(() => openPage(id))}
        />
        <span />
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
                {editingPage ? (
                  <>
                    <Button variant="secondary" className="flex-1" onClick={closeEditor}>
                      {dirty ? t("action.cancel") : t("creator.page.backToList")}
                    </Button>
                    <Button className="flex-1" onClick={next} disabled={stepIssues.length > 0}>
                      {dirty ? t("creator.saveAndNext") : t("creator.nextStep")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" className="flex-1" onClick={onExit}>
                      {t("creator.later")}
                    </Button>
                    {draft.step !== "review" && (
                      <Button className="flex-1" onClick={next} disabled={stepIssues.length > 0}>
                        {t("creator.nextStep")}
                      </Button>
                    )}
                  </>
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

      <Sheet
        open={pendingLeave !== null}
        onClose={() => setPendingLeave(null)}
        title={t("creator.unsaved.title")}
        description={t("creator.unsaved.description")}
        closeLabel={t("action.close")}
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={discardAndLeave}>
              {t("creator.unsaved.discard")}
            </Button>
            <Button className="flex-1" onClick={saveAndLeave}>
              {t("action.save")}
            </Button>
          </>
        }
      />
    </div>
  );
};