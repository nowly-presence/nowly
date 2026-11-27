import type { ReactNode } from "react";
import { readableName } from "@/lib/readable-name";
import { useI18n } from "@/hooks/i18n-provider";
import { conditionVariable, operatorNeedsValue } from "@nowly/presence-creator/creator-conditions";
import type { CreatorCondition, CreatorConditionAction, CreatorPage } from "@nowly/presence-creator/creator-types";
import type { LongLocale } from "@/shared/locales";
import { cn } from "@/ui/cn";
import { DotSeparator } from "@/ui/dot-separator";
import { ACTION_META, actionSummary } from "@/components/shared/condition-action-meta";

type KeywordTone = "if" | "then" | "else";

const KEYWORD_TONES: Record<KeywordTone, string> = {
  if: "bg-primary text-on-primary",
  then: "bg-success-soft text-success",
  else: "bg-press text-muted"
};

export const Keyword = ({ tone, children }: { tone: KeywordTone; children: ReactNode }) => (
  <span className={cn("inline-flex h-6 w-fit shrink-0 items-center rounded-md px-2 text-label-sm font-bold tracking-wide uppercase", KEYWORD_TONES[tone])}>
    {children}
  </span>
);

const Token = ({ children, muted }: { children: ReactNode; muted?: boolean }) => (
  <span
    className={cn("inline-flex h-6 max-w-full items-center truncate rounded-md px-2 text-label-md font-medium", muted ? "text-muted" : "bg-hover text-ink")}
  >
    {children}
  </span>
);

const ActionLine = ({ action, page, base }: {
  action: CreatorConditionAction;
  page: CreatorPage;
  base: LongLocale;
}) => {
  const { t } = useI18n();
  const parts = actionSummary(action, page, base, t).filter(Boolean);

  return (
    <li className="flex min-w-0 items-center gap-2 text-label-md">
      <span className="shrink-0 [&_svg]:size-4">{ACTION_META[action.kind].icon}</span>
      <span className="shrink-0 font-medium text-ink">{t(`creator.conditions.action.${action.kind}.label`)}</span>
      {parts.map((part, index) => (
        <span key={index} className="flex min-w-0 items-center gap-2">
          {index > 0 && <DotSeparator />}
          <span className="truncate text-muted">{part}</span>
        </span>
      ))}
    </li>
  );
};

const Branch = ({ tone, label, actions, page, base }: {
  tone: "then" | "else";
  label: string;
  actions: CreatorConditionAction[];
  page: CreatorPage;
  base: LongLocale;
}) => (
  <div className={cn("flex min-w-0 flex-col gap-1.5 border-l-2 pl-3", tone === "then" ? "border-success-soft" : "border-line")}>
    <Keyword tone={tone}>{label}</Keyword>
    <ul className="flex flex-col gap-1">
      {actions.map((action) => (
        <ActionLine key={action.id} action={action} page={page} base={base} />
      ))}
    </ul>
  </div>
);

export const RuleBlock = ({ page, condition, index, base }: {
  page: CreatorPage;
  condition: CreatorCondition;
  index: number;
  base: LongLocale;
}) => {
  const { t } = useI18n();
  const variable = conditionVariable(page, condition);
  const value =
    condition.operator === "between"
      ? t("creator.conditions.between", {
          min: condition.value,
          max: condition.valueMax
        })
      : condition.value;

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-label-sm font-medium text-muted tabular-nums">{index + 1}</span>
        <Keyword tone="if">{t("creator.conditions.if")}</Keyword>
        <Token>{variable ? readableName(variable.name) : "?"}</Token>
        <Token muted>{t(`creator.conditions.op.${condition.operator}`)}</Token>
        {operatorNeedsValue(condition.operator) && <Token>{value || "?"}</Token>}
      </div>
      {condition.actions.length > 0 && <Branch tone="then" label={t("creator.conditions.then")} actions={condition.actions} page={page} base={base} />}
      {condition.elseActions.length > 0 && <Branch tone="else" label={t("creator.conditions.else")} actions={condition.elseActions} page={page} base={base} />}
    </div>
  );
};