import { RiCheckboxCircleLine, RiCloseCircleLine } from "@remixicon/react";
import { readableName } from "@/lib/readable-name";
import { useI18n } from "@/hooks/i18n-provider";
import { CONDITION_VALUE_MAX_LENGTH, conditionValueValid, conditionVariable, evaluateCondition, operatorNeedsValue, operatorsFor } from "@nowly/presence-creator/creator-conditions";
import type { CreatorCondition, CreatorConditionType, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Field } from "@/ui/field";
import { Input } from "@/ui/input";
import { Segmented } from "@/ui/segmented";
import { Select } from "@/ui/select";
import { Keyword } from "@/components/shared/condition-rule-block";

const TYPES: CreatorConditionType[] = ["text", "number", "boolean"];
const BOUNDS = [
  {
    field: "value",
    label: "creator.conditions.min"
  },
  {
    field: "valueMax",
    label: "creator.conditions.max"
  }
] as const;

export const ConditionTest = ({ page, condition, onChange }: {
  page: CreatorPage;
  condition: CreatorCondition;
  onChange: (condition: CreatorCondition) => void;
}) => {
  const { t } = useI18n();
  const variable = conditionVariable(page, condition);
  const holds = conditionValueValid(condition) ? evaluateCondition(condition, variable?.sample) : null;

  return (
    <section className="flex flex-col gap-3">
      <Keyword tone="if">{t("creator.conditions.if")}</Keyword>
      <Field label={t("creator.conditions.element")}>
        <Select
          value={condition.variableId}
          options={page.variables.map((entry) => ({
            value: entry.id,
            label: readableName(entry.name),
            hint: entry.sample
          }))}
          onChange={(variableId) => onChange({ ...condition, variableId })}
          aria-label={t("creator.conditions.element")}
        />
      </Field>
      <Field label={t("creator.conditions.readAs")}>
        <Segmented<CreatorConditionType>
          label={t("creator.conditions.readAs")}
          value={condition.type}
          options={TYPES.map((value) => ({
            value,
            label: t(`creator.conditions.type.${value}`)
          }))}
          onChange={(type) =>
            onChange({
              ...condition,
              type,
              operator: operatorsFor(type)[0],
              value: "",
              valueMax: ""
            })
          }
        />
      </Field>
      <Field label={t("creator.conditions.operator")}>
        <Select
          value={condition.operator}
          options={operatorsFor(condition.type).map((value) => ({
            value,
            label: t(`creator.conditions.op.${value}`)
          }))}
          onChange={(operator) =>
            onChange({
              ...condition,
              operator: operatorsFor(condition.type).find((entry) => entry === operator) ?? condition.operator
            })
          }
          aria-label={t("creator.conditions.operator")}
        />
      </Field>
      {operatorNeedsValue(condition.operator) && condition.operator !== "between" && (
        <Field
          label={t("creator.conditions.value")}
          hint={condition.type === "text" ? t(condition.operator === "matches" ? "creator.conditions.patternHint" : "creator.conditions.textHint") : undefined}
        >
          <Input
            value={condition.value}
            maxLength={CONDITION_VALUE_MAX_LENGTH}
            inputMode={condition.type === "number" ? "decimal" : undefined}
            placeholder={condition.type === "number" ? "0" : t("creator.conditions.valueText")}
            spellCheck={false}
            onChange={(event) =>
              onChange({
                ...condition,
                value: event.target.value
              })
            }
            aria-label={t("creator.conditions.value")}
          />
        </Field>
      )}
      {condition.operator === "between" && (
        <div className="grid grid-cols-2 gap-2">
          {BOUNDS.map(({ field, label }) => (
            <Field key={field} label={t(label)}>
              <Input
                inputMode="decimal"
                placeholder="0"
                maxLength={CONDITION_VALUE_MAX_LENGTH}
                value={condition[field]}
                onChange={(event) =>
                  onChange({
                    ...condition,
                    [field]: event.target.value
                  })
                }
                aria-label={t(label)}
              />
            </Field>
          ))}
        </div>
      )}
      {holds !== null && (
        <p className={`flex items-start gap-1.5 text-label-md ${holds ? "text-success" : "text-muted"}`}>
          {holds ? <RiCheckboxCircleLine className="mt-0.5 size-4 shrink-0" /> : <RiCloseCircleLine className="mt-0.5 size-4 shrink-0" />}
          <span className="min-w-0 break-words">
            {t(holds ? "creator.conditions.liveTrue" : "creator.conditions.liveFalse", { value: variable?.sample || t("creator.conditions.nothing") })}
          </span>
        </p>
      )}
    </section>
  );
};