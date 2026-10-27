import type { ReactNode } from "react";
import { Sheet } from "@/ui/sheet";

export type SheetStep = {
  id: string;
  title: string;
  description?: string;
  content?: ReactNode;
  footer?: ReactNode;
};

type MultiStepSheetProps = {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  steps: readonly SheetStep[];
  currentStep: string;
  busy?: boolean;
};

export const MultiStepSheet = ({ open, onClose, closeLabel, steps, currentStep, busy = false }: MultiStepSheetProps) => {
  const index = steps.findIndex((step) => step.id === currentStep);
  const step = steps[index];

  if (!step) return null;

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      closeLabel={closeLabel}
      title={step.title}
      description={step.description}
      progress={steps.length > 1 ? { current: index + 1, total: steps.length } : undefined}
      footer={step.footer}
    >
      {step.content}
    </Sheet>
  );
};