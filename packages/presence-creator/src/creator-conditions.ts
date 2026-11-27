import { isUrlTemplate } from "./creator-activity";
import { creatorId } from "./creator-draft";
import { CREATOR_CONDITION_OPERATORS, type CreatorCondition, type CreatorConditionAction, type CreatorConditionActionKind, type CreatorConditionOperator, type CreatorConditionType, type CreatorPage, type CreatorVariable, type LocalizedText } from "./creator-types";

export const CONDITIONS_PER_PAGE_MAX = 10;
export const CONDITION_ACTIONS_MAX = 8;
export const CONDITION_VALUE_MAX_LENGTH = 128;

export const BUTTON_ACTION_KINDS: readonly CreatorConditionActionKind[] = ["hideButton", "buttonLabel", "buttonLink"];

const VALUELESS_OPERATORS: readonly CreatorConditionOperator[] = ["empty", "notEmpty", "exists", "missing"];

export const operatorNeedsValue = (operator: CreatorConditionOperator): boolean => !VALUELESS_OPERATORS.includes(operator);

export const operatorsFor = (type: CreatorConditionType): readonly CreatorConditionOperator[] => CREATOR_CONDITION_OPERATORS[type];

export const createCondition = (variableId: string): CreatorCondition => ({
  id: creatorId(),
  variableId,
  type: "text",
  operator: "contains",
  value: "",
  valueMax: "",
  actions: [],
  elseActions: []
});

export const createConditionAction = (kind: CreatorConditionActionKind, page: CreatorPage): CreatorConditionAction => {
  const id = creatorId();
  const buttonId = page.buttons[0]?.id ?? "";

  switch (kind) {
    case "details":
    case "state":
    case "activityName":
    case "imageText":
      return {
        id,
        kind,
        text: {}
      };
    case "largeImage":
      return {
        id,
        kind,
        image: { kind: "logo" }
      };
    case "smallImage":
      return {
        id,
        kind,
        image: { kind: "icon" }
      };
    case "activityType":
      return {
        id,
        kind,
        activityType: page.activityType
      };
    case "timestamps":
      return {
        id,
        kind,
        timestamps: page.timestamps === "media" ? "elapsed" : "media"
      };
    case "hideButton":
      return { id, kind, buttonId };
    case "buttonLabel":
      return {
        id,
        kind,
        buttonId,
        text: {}
      };
    case "buttonLink":
      return {
        id,
        kind,
        buttonId,
        link: { kind: "page" }
      };
    case "hidePresence":
      return { id, kind };
  }
};

export const conditionVariable = (page: CreatorPage, condition: CreatorCondition): CreatorVariable | undefined =>
  page.variables.find((variable) => variable.id === condition.variableId);

const isNumber = (value: string): boolean => value.trim() !== "" && Number.isFinite(Number(value));

const isPattern = (value: string): boolean => {
  try {
    new RegExp(value.trim(), "i");
    return true;
  } catch {
    return false;
  }
};

export const conditionValueValid = (condition: CreatorCondition): boolean => {
  if (!operatorsFor(condition.type).includes(condition.operator)) return false;
  if (!operatorNeedsValue(condition.operator)) return true;
  if (condition.type === "number") {
    if (!isNumber(condition.value)) return false;

    return condition.operator !== "between" || (isNumber(condition.valueMax) && Number(condition.value) <= Number(condition.valueMax));
  }
  if (!condition.value.trim()) return false;

  return condition.operator !== "matches" || isPattern(condition.value);
};

const hasVariable = (page: CreatorPage, id: string): boolean => page.variables.some((variable) => variable.id === id);

const sourceValid = (page: CreatorPage, source: {
  kind: string;
  template?: string;
  variableId?: string;
}): boolean => {
  if (source.kind === "custom") return isUrlTemplate(source.template ?? "");
  if (source.kind === "variable") return hasVariable(page, source.variableId ?? "");

  return true;
};

export const conditionActionValid = (page: CreatorPage, action: CreatorConditionAction): boolean => {
  switch (action.kind) {
    case "largeImage":
    case "smallImage":
      return sourceValid(page, action.image);
    case "hideButton":
    case "buttonLabel":
      return page.buttons.some((button) => button.id === action.buttonId);
    case "buttonLink":
      return page.buttons.some((button) => button.id === action.buttonId) && sourceValid(page, action.link);
    default:
      return true;
  }
};

export const conditionTexts = (action: CreatorConditionAction): LocalizedText | undefined => ("text" in action ? action.text : undefined);

export const usableConditions = (page: CreatorPage): CreatorCondition[] =>
  page.conditions.flatMap((condition) =>
    conditionVariable(page, condition) && conditionValueValid(condition)
      ? [
          {
            ...condition,
            actions: condition.actions.filter((action) => conditionActionValid(page, action)),
            elseActions: condition.elseActions.filter((action) => conditionActionValid(page, action))
          }
        ]
      : []
  );

export const conditionNumber = (value: string | undefined): number => Number.parseFloat((value ?? "").replace(/[^\d.-]/g, ""));

export const evaluateCondition = (condition: CreatorCondition, raw: string | undefined): boolean => {
  const text = (raw ?? "").toLowerCase();
  const target = condition.value.trim().toLowerCase();
  const number = conditionNumber(raw);
  const min = Number(condition.value);
  const max = Number(condition.valueMax);

  switch (condition.operator) {
    case "contains":
      return text.includes(target);
    case "notContains":
      return !text.includes(target);
    case "equals":
      return text === target;
    case "notEquals":
      return text !== target;
    case "startsWith":
      return text.startsWith(target);
    case "endsWith":
      return text.endsWith(target);
    case "matches":
      return isPattern(condition.value) && new RegExp(condition.value.trim(), "i").test(raw ?? "");
    case "empty":
    case "missing":
      return !raw;
    case "notEmpty":
    case "exists":
      return Boolean(raw);
    case "gt":
      return number > min;
    case "gte":
      return number >= min;
    case "lt":
      return number < min;
    case "lte":
      return number <= min;
    case "eq":
      return number === min;
    case "neq":
      return number !== min;
    case "between":
      return number >= min && number <= max;
  }
};

export const CONDITION_HELPER_SOURCES = {
  text: ['const textOf = (value: string | undefined): string => (value ?? "").toLowerCase()'],
  number: ['const numberOf = (value: string | undefined): number => Number.parseFloat((value ?? "").replace(/[^\\d.-]/g, ""))']
};

const quote = (value: string): string => JSON.stringify(value);

export const conditionHelper = (condition: CreatorCondition): keyof typeof CONDITION_HELPER_SOURCES | null => {
  if (condition.type === "number") return "number";
  if (["contains", "notContains", "equals", "notEquals", "startsWith", "endsWith"].includes(condition.operator)) return "text";

  return null;
};

export const conditionExpression = (condition: CreatorCondition, name: string): string => {
  const target = quote(condition.value.trim().toLowerCase());
  const min = String(Number(condition.value));
  const max = String(Number(condition.valueMax));

  switch (condition.operator) {
    case "contains":
      return `textOf(${name}).includes(${target})`;
    case "notContains":
      return `!textOf(${name}).includes(${target})`;
    case "equals":
      return `textOf(${name}) === ${target}`;
    case "notEquals":
      return `textOf(${name}) !== ${target}`;
    case "startsWith":
      return `textOf(${name}).startsWith(${target})`;
    case "endsWith":
      return `textOf(${name}).endsWith(${target})`;
    case "matches":
      return `new RegExp(${quote(condition.value.trim())}, "i").test(${name} ?? "")`;
    case "empty":
    case "missing":
      return `!${name}`;
    case "notEmpty":
    case "exists":
      return `Boolean(${name})`;
    case "gt":
      return `numberOf(${name}) > ${min}`;
    case "gte":
      return `numberOf(${name}) >= ${min}`;
    case "lt":
      return `numberOf(${name}) < ${min}`;
    case "lte":
      return `numberOf(${name}) <= ${min}`;
    case "eq":
      return `numberOf(${name}) === ${min}`;
    case "neq":
      return `numberOf(${name}) !== ${min}`;
    case "between":
      return `numberOf(${name}) >= ${min} && numberOf(${name}) <= ${max}`;
  }
};

export const firedActions = (page: CreatorPage, values: Record<string, string | undefined>): CreatorConditionAction[] =>
  usableConditions(page).flatMap((condition) => {
    const variable = conditionVariable(page, condition);
    return variable && evaluateCondition(condition, values[variable.name]) ? condition.actions : condition.elseActions;
  });