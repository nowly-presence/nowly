import { useState } from "react";
import { RiArrowDownSLine, RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { CREATOR_STEPS, type CreatorDraft, type CreatorStep } from "@nowly/presence-creator/creator-types";
import { issuesForStep, type CreatorIssue } from "@nowly/presence-creator/creator-validation";
import { cn } from "@/ui/cn";
import { Sheet } from "@/ui/sheet";
import { STEP_META } from "@/features/creator/creator-steps";

type CreatorStepSheetProps = {
  draft: CreatorDraft;
  issues: CreatorIssue[];
  current: CreatorStep;
  onGoToStep: (step: CreatorStep) => void;
  onOpenPage: (id: string) => void;
};

const StatusIcon = ({ count }: {
  count: number;
}) => {
  const { t } = useI18n();
  return count > 0 ? (
    <RiErrorWarningFill className="size-3.5 shrink-0 text-danger" aria-label={t("creator.review.toFix", { count })} />
  ) : (
    <RiCheckboxCircleFill className="size-3.5 shrink-0 text-success" aria-label={t("creator.review.complete")} />
  );
};

export const CreatorStepSheet = ({ draft, issues, current, onGoToStep, onOpenPage }: CreatorStepSheetProps) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const index = CREATOR_STEPS.indexOf(current);
  const pageIssues = issuesForStep(issues, "pages");

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${t("creator.progress", {
          step: index + 1,
          total: CREATOR_STEPS.length
        })}, ${t(STEP_META[current].title)}`}
        className="flex h-9 min-w-0 items-center gap-2 rounded-full border border-line bg-surface pr-2.5 pl-1.5 text-label-md font-medium hover:bg-hover"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-label-sm text-on-primary">{index + 1}</span>
        <span className="truncate">{t(STEP_META[current].title)}</span>
        <RiArrowDownSLine className="size-4 shrink-0 text-muted" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("creator.stepSheet.title")} closeLabel={t("action.close")}>
        <ol className="flex flex-col">
          {CREATOR_STEPS.map((step, position) => {
            const active = step === current;
            const last = position === CREATOR_STEPS.length - 1;
            return (
              <li key={step} className="flex gap-3">
                <span className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-label-md font-medium",
                      active ? "bg-primary text-on-primary" : position < index ? "bg-primary-soft text-primary" : "bg-hover text-muted"
                    )}
                  >
                    {position + 1}
                  </span>
                  {!last && <span className="my-1 w-0.5 flex-1 rounded-full bg-line-strong" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col pb-4">
                  <button
                    type="button"
                    aria-current={active ? "step" : undefined}
                    onClick={() => choose(() => onGoToStep(step))}
                    className="flex min-h-7 items-center justify-between gap-2 text-left"
                  >
                    <span className={cn("truncate text-label-lg font-medium", active && "text-primary")}>{t(STEP_META[step].title)}</span>
                    <StatusIcon count={issuesForStep(issues, step).length} />
                  </button>
                  {step === "pages" &&
                    draft.pages.map((page) => (
                      <span key={page.id} className="mt-1 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => choose(() => onOpenPage(page.id))}
                          className="min-w-0 flex-1 truncate rounded-md bg-hover px-3 py-2 text-left text-label-md hover:bg-press"
                        >
                          {page.name.trim() || t("creator.untitled")}
                        </button>
                        <StatusIcon count={pageIssues.filter((issue) => issue.page === page.name).length} />
                      </span>
                    ))}
                </span>
              </li>
            );
          })}
        </ol>
      </Sheet>
    </>
  );
};