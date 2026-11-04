import { useRef, useState } from "react";
import { RiBracesLine } from "@remixicon/react";
import { readableName } from "@/lib/readable-name";
import { useI18n } from "@/hooks/i18n-provider";
import type { CreatorVariable } from "@nowly/presence-creator/creator-types";
import { cn } from "@/ui/cn";
import { Field } from "@/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/ui/input-group";
import { MenuButton } from "@/ui/menu-button";

export type TemplateField = {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  value: string;
  placeholder?: string;
  maxLength: number;
  invalid?: boolean;
  spellCheck?: boolean;
  prefix?: string;
  onChange: (value: string) => void;
};

const TOKEN_PATTERN = /\{([A-Za-z0-9_]+)\}/g;

const Tokens = ({ value, variables }: {
  value: string;
  variables: CreatorVariable[];
}) => {
  const parts = value.split(TOKEN_PATTERN);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 && variables.some((variable) => variable.name === part) ? (
          <span key={index} className="mx-0.5 inline-flex items-center rounded-md bg-primary-soft px-1.5 py-0.5 text-label-md font-medium text-primary">
            {readableName(part)}
          </span>
        ) : (
          <span key={index}>{index % 2 === 1 ? `{${part}}` : part}</span>
        )
      )}
    </>
  );
};

const TemplateRow = ({ field, variables }: {
  field: TemplateField;
  variables: CreatorVariable[];
}) => {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const hasTokens = variables.some((variable) => field.value.includes(`{${variable.name}}`));
  const showTokens = hasTokens && !focused;

  const prefix = field.prefix && field.value.startsWith(field.prefix) ? field.prefix : undefined;
  const shown = prefix ? field.value.slice(prefix.length) : field.value;
  const change = (next: string) => field.onChange(prefix ? `${prefix}${next.startsWith(prefix) ? next.slice(prefix.length) : next}` : next);

  const insert = (name: string) => {
    const input = inputRef.current;
    const token = `{${name}}`;
    setFocused(true);
    const start = input?.selectionStart ?? shown.length;
    const end = input?.selectionEnd ?? shown.length;
    change(`${shown.slice(0, start)}${token}${shown.slice(end)}`);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <Field label={field.label} hint={field.hint} optional={field.optional ? t("creator.texts.optional") : undefined} invalid={field.invalid}>
      <InputGroup>
        {prefix && (
          <InputGroupAddon text className="pr-0">
            {prefix}
          </InputGroupAddon>
        )}
        {showTokens && (
          <button
            type="button"
            onClick={() => {
              setFocused(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className={cn("flex h-full min-w-0 flex-1 items-center overflow-hidden whitespace-nowrap px-3 text-left text-body-sm text-ink", prefix && "pl-0.5")}
          >
            <Tokens value={shown} variables={variables} />
          </button>
        )}
        <InputGroupInput
          ref={inputRef}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={showTokens ? "hidden" : prefix ? "pl-0.5" : undefined}
          value={shown}
          onChange={(event) => change(event.target.value)}
          placeholder={prefix && field.placeholder?.startsWith(prefix) ? field.placeholder.slice(prefix.length) : field.placeholder}
          maxLength={field.maxLength}
          spellCheck={field.spellCheck}
        />
        {variables.length > 0 && (
          <MenuButton
            label={t("creator.texts.insertIn", { field: field.label })}
            heading={t("creator.texts.insertHeading")}
            items={variables.map((variable) => ({
              value: variable.name,
              label: readableName(variable.name),
              hint: variable.sample
            }))}
            onSelect={insert}
            className="flex shrink-0 items-center gap-1 border-l border-line px-3 text-label-md font-medium text-primary transition-colors hover:bg-hover aria-expanded:bg-hover"
          >
            <RiBracesLine className="size-4" />
            {t("creator.texts.insert")}
          </MenuButton>
        )}
      </InputGroup>
    </Field>
  );
};

type TemplateFieldsProps = {
  fields: TemplateField[];
  variables: CreatorVariable[];
  framed?: boolean;
};

export const TemplateFields = ({ fields, variables, framed = false }: TemplateFieldsProps) => (
  <div className={cn("flex flex-col gap-4", framed && "rounded-md border border-line bg-surface p-4")}>
    {fields.map((field) => (
      <TemplateRow key={field.id} field={field} variables={variables} />
    ))}
  </div>
);

type TemplateInputProps = Omit<TemplateField, "id"> & {
  variables: CreatorVariable[];
};

export const TemplateInput = ({ variables, ...field }: TemplateInputProps) => (
  <TemplateFields
    fields={[
      {
        id: "value",
        ...field
      }
    ]}
    variables={variables}
  />
);