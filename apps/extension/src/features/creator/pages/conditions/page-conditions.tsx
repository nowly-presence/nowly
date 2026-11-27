import { useState } from "react";
import { RiAddLine, RiInformationLine, RiSettings3Line } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { isImageVariable } from "@nowly/presence-creator/creator-activity";
import { CONDITIONS_PER_PAGE_MAX, createCondition } from "@nowly/presence-creator/creator-conditions";
import type { CreatorDraft, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Button } from "@/ui/button";
import { Frame } from "@/ui/frame";
import { RuleBlock } from "@/components/shared/condition-rule-block";
import { ConditionSheet } from "@/features/creator/pages/conditions/condition-sheet";

export const PageConditions = ({ draft, page, onChange }: {
  draft: CreatorDraft;
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const firstVariable = page.variables.find((variable) => !isImageVariable(variable)) ?? page.variables[0];

  const addCondition = () => {
    if (!firstVariable) return;

    const condition = createCondition(firstVariable.id);
    onChange({
      ...page,
      conditions: [...page.conditions, condition]
    });
    setEditingId(condition.id);
  };

  return (
    <Frame
      title={t("creator.conditions.title")}
      description={t("creator.conditions.description")}
      padded={false}
      action={
        <Button
          size="sm"
          icon={<RiAddLine className="size-3.5" />}
          disabled={!firstVariable || page.conditions.length >= CONDITIONS_PER_PAGE_MAX}
          onClick={addCondition}
        >
          {t("creator.conditions.add")}
        </Button>
      }
      footer={
        page.conditions.length > 1 ? (
          <span className="flex items-center gap-1.5 text-label-md text-muted">
            <RiInformationLine className="size-4 shrink-0" />
            {t("creator.conditions.order")}
          </span>
        ) : undefined
      }
    >
      {page.conditions.length === 0 && (
        <p className="px-4 py-5 text-center text-label-md text-muted">{firstVariable ? t("creator.conditions.none") : t("creator.conditions.needsElement")}</p>
      )}
      {page.conditions.map((condition, index) => (
        <div key={condition.id} className="flex items-start gap-2 p-3">
          <div className="min-w-0 flex-1">
            <RuleBlock page={page} condition={condition} index={index} base={draft.baseLocale} />
          </div>
          <Button variant="secondary" size="icon-sm" aria-label={t("creator.conditions.edit")} onClick={() => setEditingId(condition.id)}>
            <RiSettings3Line className="size-4" />
          </Button>
        </div>
      ))}
      <ConditionSheet draft={draft} page={page} conditionId={editingId} onChange={onChange} onClose={() => setEditingId(null)} />
    </Frame>
  );
};