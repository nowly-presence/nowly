import { useRef } from "react";
import { RiBracesLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import type { CreatorVariable } from "@nowly/presence-creator/creator-types";
import { cn } from "@/ui/cn";
import { Field } from "@/ui/field";
import { InputGroup, InputGroupInput } from "@/ui/input-group";
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
  onChange: (value: string) => void;
};

const TemplateRow = ({ field, variables }: {
  field: TemplateField;
  variables: CreatorVariable[];
}) => {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const insert = (name: string) => {
    const input = inputRef.current;
    const token = `{${name}}`;
    const start = input?.selectionStart ?? field.value.length;
    const end = input?.selectionEnd ?? field.value.length;
    field.onChange(`${field.value.slice(0, start)}${token}${field.value.slice(end)}`);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <Field label={field.label} hint={field.hint} optional={field.optional ? t("creator.texts.optional") : undefined} invalid={field.invalid}>
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          value={field.value}
          onChange={(event) => field.onChange(event.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          spellCheck={field.spellCheck}
        />
        {variables.length > 0 && (
          <MenuButton
            label={t("creator.texts.insertIn", { field: field.label })}
            heading={t("creator.texts.insertHeading")}
            items={variables.map((variable) => ({
              value: variable.name,
              label: `{${variable.name}}`,
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