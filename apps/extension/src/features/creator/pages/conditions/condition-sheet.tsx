import { useState } from "react";
import { RiAddLine, RiArrowLeftLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { CONDITION_ACTIONS_MAX, createConditionAction } from "@nowly/presence-creator/creator-conditions";
import { writtenLocales } from "@nowly/presence-creator/creator-files";
import type { CreatorCondition, CreatorConditionAction, CreatorConditionActionKind, CreatorDraft, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { SwitchRow } from "@/ui/row";
import { Sheet } from "@/ui/sheet";
import { CreatorLocaleTabs, useEditLocale } from "@/features/creator/creator-locale-tabs";
import { ConditionActionCard } from "@/features/creator/pages/conditions/condition-action-card";
import { Keyword } from "@/components/shared/condition-rule-block";
import { ConditionPicker } from "@/features/creator/pages/conditions/condition-picker";
import { ConditionTest } from "@/features/creator/pages/conditions/condition-test";

type Branch = "actions" | "elseActions";

type ConditionSheetProps = {
  draft: CreatorDraft;
  page: CreatorPage;
  conditionId: string | null;
  onChange: (page: CreatorPage) => void;
  onClose: () => void;
};

export const ConditionSheet = ({ draft, page, conditionId, onChange, onClose }: ConditionSheetProps) => {
  const { t } = useI18n();
  const [picking, setPicking] = useState<Branch | null>(null);
  const base = draft.baseLocale;
  const locales = writtenLocales(draft);
  const [locale, setLocale] = useEditLocale(`page:${page.id}`, locales, base);
  const condition = page.conditions.find((entry) => entry.id === conditionId);

  const setCondition = (next: CreatorCondition, nextPage: CreatorPage = page) =>
    onChange({
      ...nextPage,
      conditions: nextPage.conditions.map((entry) => (entry.id === next.id ? next : entry))
    });

  const close = () => {
    setPicking(null);
    onClose();
  };

  const remove = () => {
    onChange({
      ...page,
      conditions: page.conditions.filter((entry) => entry.id !== conditionId)
    });
    close();
  };

  const addAction = (kind: CreatorConditionActionKind) => {
    if (!condition || !picking) return;

    setCondition({
      ...condition,
      [picking]: [
        ...condition[picking],
        createConditionAction(kind, page)
      ]
    });
    setPicking(null);
  };

  const actionList = (current: CreatorCondition, branch: Branch) => {
    const replace = (action: CreatorConditionAction, nextPage: CreatorPage = page) => {
      const latest = nextPage.conditions.find((entry) => entry.id === current.id) ?? current;
      setCondition(
        {
          ...latest,
          [branch]: latest[branch].map((entry) => (entry.id === action.id ? action : entry))
        },
        nextPage
      );
    };
    return (
      <div className="flex flex-col gap-2">
        {current[branch].map((action) => (
          <ConditionActionCard
            key={action.id}
            page={page}
            action={action}
            locale={locale}
            base={base}
            onChange={replace}
            onRemove={() =>
              setCondition({
                ...current,
                [branch]: current[branch].filter((entry) => entry.id !== action.id)
              })
            }
          />
        ))}
        <Button
          variant="secondary"
          size="sm"
          icon={<RiAddLine className="size-3.5" />}
          disabled={current[branch].length >= CONDITION_ACTIONS_MAX}
          onClick={() => setPicking(branch)}
        >
          {t("creator.conditions.addAction")}
        </Button>
      </div>
    );
  };

  return (
    <Sheet
      open={Boolean(condition)}
      onClose={close}
      title={picking ? t("creator.conditions.pickTitle") : t("creator.conditions.sheetTitle")}
      description={picking ? t("creator.conditions.pickHint") : undefined}
      closeLabel={t("action.close")}
      footer={
        picking ? (
          <Button variant="secondary" className="flex-1" icon={<RiArrowLeftLine className="size-4" />} onClick={() => setPicking(null)}>
            {t("creator.conditions.back")}
          </Button>
        ) : (
          <>
            <Button variant="danger" className="flex-1" onClick={remove}>
              {t("creator.conditions.remove")}
            </Button>
            <Button className="flex-1" onClick={close}>
              {t("creator.conditions.done")}
            </Button>
          </>
        )
      }
    >
      {condition && picking && <ConditionPicker page={page} onPick={addAction} />}
      {condition && !picking && (
        <div className="flex flex-col gap-5">
          <ConditionTest page={page} condition={condition} onChange={setCondition} />
          <CreatorLocaleTabs locales={locales} value={locale} base={base} onChange={setLocale} />
          <section className="flex flex-col gap-3">
            <Keyword tone="then">{t("creator.conditions.then")}</Keyword>
            {actionList(condition, "actions")}
          </section>
          <section className="flex flex-col gap-3">
            <Group>
              <SwitchRow
                title={t("creator.conditions.else")}
                description={t("creator.conditions.elseHint")}
                checked={condition.elseActions.length > 0}
                onChange={(checked) =>
                  checked
                    ? setPicking("elseActions")
                    : setCondition({
                        ...condition,
                        elseActions: []
                      })
                }
                label={t("creator.conditions.else")}
              />
            </Group>
            {condition.elseActions.length > 0 && actionList(condition, "elseActions")}
          </section>
        </div>
      )}
    </Sheet>
  );
};