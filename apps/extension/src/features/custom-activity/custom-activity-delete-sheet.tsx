import { useEffect } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { Button, Spinner } from "@/ui/button";
import { MultiStepSheet, type SheetStep } from "@/ui/multi-step-sheet";
import { useCustomActivityDeletion } from "@/features/custom-activity/use-custom-activity-deletion";

type CustomActivityDeleteSheetProps = {
  id: string;
  name: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  onPreparingChange: (preparing: boolean) => void;
};

const actionClassName = "h-auto min-h-9 min-w-0 flex-1 whitespace-normal py-2";

export const CustomActivityDeleteSheet = ({ id, name, pending, onClose, onConfirm, onPreparingChange }: CustomActivityDeleteSheetProps) => {
  const { t } = useI18n();
  const deletion = useCustomActivityDeletion(id, onConfirm);
  useEffect(() => {
    onPreparingChange(!deletion.prepared);
  }, [deletion.prepared, onPreparingChange]);

  if (!deletion.prepared) return null;

  const busy = pending || deletion.busy;
  const cancel = (
    <Button variant="secondary" className={actionClassName} disabled={busy} onClick={onClose}>
      {t("action.cancel")}
    </Button>
  );
  const error = deletion.error ? (
    <p role="alert" className="text-body-sm text-danger">
      {deletion.error}
    </p>
  ) : undefined;
  const deleteStep: SheetStep = {
    id: "delete",
    title: t("custom.delete.title", { name }),
    description: t("custom.delete.description"),
    content: error,
    footer: (
      <>
        {cancel}
        <Button variant="destructive" className={actionClassName} loading={busy} onClick={() => void deletion.remove()}>
          {t("action.delete")}
        </Button>
      </>
    )
  };
  const withdrawalStep: SheetStep = {
    id: "withdraw",
    title: t("custom.delete.withdrawTitle"),
    description: t("custom.delete.publicationHint"),
    content: error,
    footer: (
      <>
        {cancel}
        <Button className={actionClassName} loading={busy} onClick={() => void deletion.withdraw()}>
          {t("custom.delete.withdraw")}
        </Button>
      </>
    )
  };
  const checkingStep: SheetStep = {
    id: "checking",
    title: t("custom.delete.title", { name }),
    description: t("custom.delete.checking"),
    content: <Spinner className="size-4 text-muted" />,
    footer: cancel
  };
  const blockedStep: SheetStep = {
    id: "blocked",
    title: t("custom.delete.title", { name }),
    content: error,
    footer: (
      <>
        {cancel}
        <Button className={actionClassName} onClick={() => void deletion.load()}>
          {t("action.retry")}
        </Button>
      </>
    )
  };
  const firstStep = deletion.stage === "checking" ? checkingStep : deletion.stage === "blocked" ? blockedStep : withdrawalStep;
  const steps = deletion.hasWithdrawal ? [firstStep, deleteStep] : deletion.stage === "delete" ? [deleteStep] : [firstStep];

  return <MultiStepSheet open onClose={onClose} closeLabel={t("action.close")} steps={steps} currentStep={deletion.stage} busy={busy} />;
};