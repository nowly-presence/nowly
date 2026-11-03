import { useI18n } from "@/hooks/i18n-provider";
import { isUrlTemplate } from "@nowly/presence-creator/creator-activity";
import { addVariable, createVariable } from "@nowly/presence-creator/creator-draft";
import type { CreatorPage, CreatorVariable } from "@nowly/presence-creator/creator-types";
import { Field } from "@/ui/field";
import { Select } from "@/ui/select";
import { useToast } from "@/ui/toast";
import { TemplateInput } from "@/features/creator/pages/template-input";
import { usePicker } from "@/features/creator/pages/use-picker";

export type UrlSource = {
  kind: "default";
} | {
  kind: "variable";
  variableId: string;
} | {
  kind: "custom";
  template: string;
};

const URL_MAX_LENGTH = 256;
const PICK = "__pick";
const CUSTOM = "__custom";
const DEFAULT = "__default";

type UrlSourceFieldProps = {
  read: "image" | "link";
  label: string;
  hint: string;
  defaultLabel: string;
  value: UrlSource;
  page: CreatorPage;
  candidates: CreatorVariable[];
  onChange: (page: CreatorPage, value: UrlSource) => void;
};

export const UrlSourceField = ({ read, label, hint, defaultLabel, value, page, candidates, onChange }: UrlSourceFieldProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const { picking, pick } = usePicker();
  const isImage = read === "image";

  const pickOnPage = async () => {
    const picked = await pick();

    if (!picked) return;

    const found = isImage ? picked.image : picked.link;

    if (!found) {
      toast(t(isImage ? "creator.source.noImage" : "creator.source.noLink"), "error");
      return;
    }

    const added = addVariable(
      page,
      createVariable(
        read,
        {
          kind: "element",
          selector: picked.selector,
          read
        },
        found
      )
    );
    onChange(added.page, {
      kind: "variable",
      variableId: added.variable.id
    });
  };

  const selected = value.kind === "default" ? DEFAULT : value.kind === "custom" ? CUSTOM : value.variableId;

  return (
    <div className="flex flex-col gap-3">
      <Field label={label} hint={hint}>
        <Select
          aria-label={label}
          value={picking ? PICK : selected}
          disabled={picking}
          onChange={(next) => {
            if (next === PICK) void pickOnPage();
            else if (next === CUSTOM)
              onChange(page, {
                kind: "custom",
                template: value.kind === "custom" ? value.template : "https://"
              });
            else if (next === DEFAULT) onChange(page, { kind: "default" });
            else
              onChange(page, {
                kind: "variable",
                variableId: next
              });
          }}
          options={[
            {
              value: DEFAULT,
              label: defaultLabel
            },
            ...candidates.map((variable) => ({
              value: variable.id,
              label: `{${variable.name}}`,
              hint: variable.sample
            })),
            {
              value: PICK,
              label: picking
                ? t("creator.variables.picking")
                : t(isImage ? "creator.source.pickImage" : "creator.source.pickLink")
            },
            {
              value: CUSTOM,
              label: t("creator.source.custom"),
              hint: t(isImage ? "creator.source.customImageHint" : "creator.source.customLinkHint")
            }
          ]}
        />
      </Field>
      {value.kind === "custom" && (
        <TemplateInput
          label={t("creator.source.address")}
          hint={t("creator.source.addressHint")}
          value={value.template}
          placeholder={isImage ? "https://cdn.example.com/{id}.jpg" : "https://example.com/{id}"}
          maxLength={URL_MAX_LENGTH}
          spellCheck={false}
          invalid={!isUrlTemplate(value.template)}
          variables={page.variables}
          onChange={(template) =>
            onChange(page, {
              kind: "custom",
              template
            })
          }
        />
      )}
    </div>
  );
};