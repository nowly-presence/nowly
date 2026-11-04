import { useState } from "react";
import { readableName } from "@/lib/readable-name";
import { useI18n } from "@/hooks/i18n-provider";
import { isUrlTemplate } from "@nowly/presence-creator/creator-activity";
import { addVariable, createVariable } from "@nowly/presence-creator/creator-draft";
import type { CreatorPage, CreatorVariable } from "@nowly/presence-creator/creator-types";
import { Button } from "@/ui/button";
import { OptionCards } from "@/ui/option-cards";
import { MenuButton } from "@/ui/menu-button";
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

type UrlSourceMode = UrlSource["kind"];

const URL_MAX_LENGTH = 256;
const PICK = "__pick";

type UrlSourceFieldProps = {
  read: "image" | "link";
  label: string;
  defaultLabel: string;
  value: UrlSource;
  page: CreatorPage;
  candidates: CreatorVariable[];
  onChange: (page: CreatorPage, value: UrlSource) => void;
};

export const UrlSourceField = ({ read, label, defaultLabel, value, page, candidates, onChange }: UrlSourceFieldProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const { picking, pick } = usePicker();
  const [awaitingPick, setAwaitingPick] = useState(false);
  const isImage = read === "image";
  const selected = value.kind === "variable" ? candidates.find((variable) => variable.id === value.variableId) : undefined;
  const mode: UrlSourceMode = awaitingPick ? "variable" : value.kind;

  const pickOnPage = async () => {
    const picked = await pick();

    if (!picked) return false;

    const found = isImage ? picked.image : picked.link;

    if (!found) {
      toast(t(isImage ? "creator.source.noImage" : "creator.source.noLink"), "error");
      return false;
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
    return true;
  };

  const startPicking = async () => {
    setAwaitingPick(true);
    await pickOnPage();
    setAwaitingPick(false);
  };

  const choose = (next: UrlSourceMode) => {
    if (next === "default") onChange(page, { kind: "default" });
    else if (next === "custom")
      onChange(page, {
        kind: "custom",
        template: value.kind === "custom" ? value.template : "https://"
      });
    else if (candidates[0])
      onChange(page, {
        kind: "variable",
        variableId: candidates[0].id
      });
    else void startPicking();
  };

  return (
    <div className="flex flex-col gap-3">
      <OptionCards<UrlSourceMode>
        size="xs"
        columns={3}
        label={label}
        value={mode}
        onValueChange={choose}
        options={[
          {
            value: "default",
            label: defaultLabel
          },
          {
            value: "variable",
            label: t("creator.source.page")
          },
          {
            value: "custom",
            label: t("creator.source.address")
          }
        ]}
      />
      {mode === "variable" && candidates.length > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-hover px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-label-lg font-medium text-ink">{selected ? readableName(selected.name) : t(isImage ? "creator.source.pickImage" : "creator.source.pickLink")}</p>
            {selected?.sample && <p className="truncate text-label-md text-muted">{selected.sample}</p>}
          </div>
          <MenuButton
            label={label}
            items={[
              ...candidates.map((variable) => ({
                value: variable.id,
                label: readableName(variable.name),
                hint: variable.sample
              })),
              {
                value: PICK,
                label: picking
                  ? t("creator.variables.picking")
                  : t(isImage ? "creator.source.pickImage" : "creator.source.pickLink")
              }
            ]}
            onSelect={(next) => {
              if (next === PICK) void startPicking();
              else
                onChange(page, {
                  kind: "variable",
                  variableId: next
                });
            }}
            className="shrink-0 text-label-md font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
          >
            {t("creator.source.change")}
          </MenuButton>
        </div>
      )}
      {mode === "variable" && candidates.length === 0 && (
        <Button variant="secondary" loading={picking} onClick={() => void startPicking()}>
          {t(isImage ? "creator.source.pickImage" : "creator.source.pickLink")}
        </Button>
      )}
      {value.kind === "custom" && (
        <TemplateInput
          label={t("creator.source.address")}
          hint={t("creator.source.addressHint")}
          value={value.template}
          placeholder={isImage ? "https://cdn.example.com/{id}.jpg" : "https://example.com/{id}"}
          maxLength={URL_MAX_LENGTH}
          spellCheck={false}
          prefix="https://"
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