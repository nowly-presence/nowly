import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { RiAddLine, RiFileCopyLine } from "@remixicon/react";
import { CustomActivityArtwork, CustomActivityGlyph } from "@/components/shared/custom-activity-artwork";
import { useI18n } from "@/hooks/i18n-provider";
import { MultiStepSheet, type SheetStep } from "@/ui/multi-step-sheet";
import { Button } from "@/ui/button";
import type { CustomActivity } from "@/shared/types";
import { DotSeparator } from "@/ui/dot-separator";
import { Row } from "@/ui/row";
import { CUSTOM_ACTIVITY_TEMPLATE_IDS, CUSTOM_ACTIVITY_TEMPLATES, templateText, type CustomActivityTemplateId } from "@/features/custom-activity/custom-activity-templates";

type CustomActivityTemplatesSheetProps = {
  open: boolean;
  onClose: () => void;
  onPick: (template: CustomActivityTemplateId | null) => void;
  activities: CustomActivity[];
  onDuplicate: (activity: CustomActivity) => void;
};

const GLYPH_SIZE = 36;

const Tile = ({ icon, title, line, onClick }: { icon: ReactNode; title: string; line: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-hover active:bg-press"
  >
    {icon}
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-label-lg font-medium text-ink">{title}</span>
      <span className="truncate text-label-md text-muted">{line}</span>
    </span>
  </button>
);

export const CustomActivityTemplatesSheet = ({ open, onClose, onPick, activities, onDuplicate }: CustomActivityTemplatesSheetProps) => {
  const { t } = useI18n();
  const [step, setStep] = useState("choice");
  useEffect(() => {
    if (open) setStep("choice");
  }, [open]);
  const chooseBlank = () => onPick(null);
  const choiceStep: SheetStep = {
    id: "choice",
    title: t("custom.templates.title"),
    description: t("custom.templates.description"),
    content: (
      <div className="grid grid-cols-2 gap-2">
        <Tile
          icon={
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-line bg-hover text-muted">
              <RiAddLine />
            </span>
          }
          title={t("custom.templates.blank")}
          line={t("custom.templates.blankHint")}
          onClick={chooseBlank}
        />
        <Tile
          icon={
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-line bg-hover text-muted">
              <RiFileCopyLine />
            </span>
          }
          title={t("custom.templates.duplicate")}
          line={t("custom.templates.duplicateHint")}
          onClick={() => setStep("duplicate")}
        />
        <div className="col-span-2 flex items-center gap-3 py-1 text-label-md text-muted" aria-hidden>
          <span className="h-px flex-1 bg-line" />
          <span>{t("custom.templates.separator")}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        {CUSTOM_ACTIVITY_TEMPLATE_IDS.map((id) => {
          const template = CUSTOM_ACTIVITY_TEMPLATES[id];
          const text = templateText(id, t);
          return (
            <Tile
              key={id}
              icon={<CustomActivityGlyph color={template.color} icon={template.icon} size={GLYPH_SIZE} />}
              title={text.name}
              line={text.details}
              onClick={() => onPick(id)}
            />
          );
        })}
      </div>
    )
  };
  const duplicateStep: SheetStep = {
    id: "duplicate",
    title: t("custom.templates.duplicate"),
    description: t("custom.templates.duplicateHint"),
    content: activities.length ? (
      <div className="divide-y divide-line overflow-hidden rounded-sm border border-line bg-surface">
        {activities.map((activity) => (
          <Row
            key={activity.id}
            onClick={() => onDuplicate(activity)}
            leading={<CustomActivityArtwork source={activity} size={36} />}
            title={activity.name}
            description={
              activity.details || activity.state ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  {activity.details && <span className="truncate">{activity.details}</span>}
                  {activity.details && activity.state && <DotSeparator />}
                  {activity.state && <span className="truncate">{activity.state}</span>}
                </span>
              ) : (
                t("custom.list.noDetails")
              )
            }
          />
        ))}
      </div>
    ) : (
      <p className="text-label-md text-muted">{t("custom.templates.duplicateHint")}</p>
    ),
    footer: (
      <Button variant="secondary" onClick={() => setStep("choice")}>
        {t("action.back")}
      </Button>
    )
  };
  const steps = step === "choice" ? [choiceStep] : [choiceStep, duplicateStep];
  return (
    <MultiStepSheet
      open={open}
      onClose={() => {
        setStep("choice");
        onClose();
      }}
      closeLabel={t("action.close")}
      steps={steps}
      currentStep={step}
    />
  );
};