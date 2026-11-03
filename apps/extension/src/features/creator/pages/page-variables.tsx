import { useState } from "react";
import { RiAddLine, RiCursorLine, RiDeleteBinLine, RiEyeLine, RiInformationLine } from "@remixicon/react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import { addVariable, createVariable, removeVariable } from "@nowly/presence-creator/creator-draft";
import type { CreatorPage, CreatorPick, CreatorSource } from "@nowly/presence-creator/creator-types";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { Field } from "@/ui/field";
import { Row } from "@/ui/row";
import { Sheet } from "@/ui/sheet";
import { usePicker } from "@/features/creator/pages/use-picker";
import { VariableSheet } from "@/features/creator/pages/variable-sheet";

type QuickSource = {
  key: MessageKey;
  hint: MessageKey;
  name: string;
  source: CreatorSource;
};

const QUICK_SOURCES: QuickSource[] = [
  {
    key: "creator.variables.tabTitle",
    hint: "creator.variables.tabTitleHint",
    name: "tabTitle",
    source: { kind: "tabTitle" }
  },
  {
    key: "creator.variables.ogTitle",
    hint: "creator.variables.ogTitleHint",
    name: "previewTitle",
    source: {
      kind: "meta",
      property: "og:title"
    }
  },
  {
    key: "creator.variables.ogDescription",
    hint: "creator.variables.ogDescriptionHint",
    name: "previewDescription",
    source: {
      kind: "meta",
      property: "og:description"
    }
  },
  {
    key: "creator.variables.ogImage",
    hint: "creator.variables.ogImageHint",
    name: "previewImage",
    source: {
      kind: "meta",
      property: "og:image"
    }
  }
];

export const useSourceLabel = () => {
  const { t } = useI18n();
  return (source: CreatorSource): string => {
    if (source.kind === "element") return source.selector;

    const quick = QUICK_SOURCES.find(
      (entry) => entry.source.kind === source.kind && (source.kind !== "meta" || (entry.source.kind === "meta" && entry.source.property === source.property))
    );
    return quick ? t(quick.key) : source.kind;
  };
};

export const PageVariables = ({ page, onChange }: {
  page: CreatorPage;
  onChange: (page: CreatorPage) => void;
}) => {
  const { t } = useI18n();
  const sourceLabel = useSourceLabel();
  const { picking, pick: startPick } = usePicker();
  const [pick, setPick] = useState<CreatorPick | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <Field label={t("creator.variables.title")} hint={t("creator.variables.hint")}>
      {page.variables.length > 0 && (
        <Group>
          {page.variables.map((variable) => (
            <Row
              key={variable.id}
              title={<span className="font-mono text-label-md">{`{${variable.name}}`}</span>}
              description={
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-mono text-label-sm">{sourceLabel(variable.source)}</span>
                  {variable.sample && <span className="truncate text-label-sm">{t("creator.variables.sample", { value: variable.sample })}</span>}
                </span>
              }
              trailing={
                <span className="flex items-center">
                  {variable.source.kind === "element" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("creator.variables.highlight", { name: variable.name })}
                      onClick={() => void sendMessage("CREATOR_HIGHLIGHT", { selector: variable.source.kind === "element" ? variable.source.selector : "" })}
                    >
                      <RiEyeLine className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("creator.variables.remove", { name: variable.name })}
                    onClick={() => onChange(removeVariable(page, variable.id))}
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                </span>
              }
            />
          ))}
        </Group>
      )}
      <div className="flex flex-col gap-2">
        <Button
          icon={<RiCursorLine className="size-4" />}
          loading={picking}
          onClick={() =>
            void startPick().then((picked) => {
              if (picked) setPick(picked);
            })
          }
        >
          {picking ? t("creator.variables.picking") : t("creator.variables.pick")}
        </Button>
        <Button variant="secondary" icon={<RiAddLine className="size-4" />} onClick={() => setQuickOpen(true)}>
          {t("creator.variables.more")}
        </Button>
      </div>
      <VariableSheet
        pick={pick}
        onClose={() => setPick(null)}
        onConfirm={(variable) => {
          onChange(addVariable(page, variable).page);
          setPick(null);
        }}
      />
      <Sheet
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        title={t("creator.variables.moreTitle")}
        description={t("creator.variables.moreDescription")}
        closeLabel={t("action.close")}
      >
        <div className="flex flex-col gap-3">
          <Group>
            {QUICK_SOURCES.map((entry) => (
              <Row
                key={entry.key}
                title={t(entry.key)}
                description={t(entry.hint)}
                align="start"
                trailing={<RiAddLine className="size-4 text-primary" aria-hidden />}
                onClick={() => {
                  onChange(addVariable(page, createVariable(entry.name, entry.source)).page);
                  setQuickOpen(false);
                }}
              />
            ))}
          </Group>
          <p className="flex items-start gap-1.5 text-label-md text-muted">
            <RiInformationLine className="mt-0.5 size-4 shrink-0" />
            {t("creator.variables.moreNote")}
          </p>
        </div>
      </Sheet>
    </Field>
  );
};