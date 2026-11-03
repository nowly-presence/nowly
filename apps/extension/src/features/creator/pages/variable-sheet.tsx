import { useEffect, useState } from "react";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { createVariable, toIdentifier } from "@/shared/creator/creator-draft";
import type { CreatorPick, CreatorReadMode, CreatorVariable } from "@/shared/creator/creator-types";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Segmented } from "@/ui/segmented";
import { Sheet } from "@/ui/sheet";
import { Field } from "@/ui/field";

const READ_KEYS: Record<CreatorReadMode, MessageKey> = {
  text: "creator.variables.readText",
  image: "creator.variables.readImage",
  link: "creator.variables.readLink"
};

const availableModes = (pick: CreatorPick): CreatorReadMode[] =>
  (["text", "image", "link"] as const).filter((mode) => (mode === "text" ? Boolean(pick.text) : mode === "image" ? Boolean(pick.image) : Boolean(pick.link)));

const valueFor = (pick: CreatorPick, mode: CreatorReadMode): string | undefined => (mode === "text" ? pick.text : mode === "image" ? pick.image : pick.link);

const suggestName = (pick: CreatorPick, mode: CreatorReadMode): string =>
  mode === "image" ? "image" : mode === "link" ? "link" : pick.tag === "h1" || pick.tag === "h2" ? "title" : "";

export const VariableSheet = ({ pick, onClose, onConfirm }: {
  pick: CreatorPick | null;
  onClose: () => void;
  onConfirm: (variable: CreatorVariable) => void;
}) => {
  const { t } = useI18n();
  const modes = pick ? availableModes(pick) : [];
  const [mode, setMode] = useState<CreatorReadMode>("text");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!pick) return;

    const first = availableModes(pick)[0] ?? "text";
    setMode(first);
    setName(suggestName(pick, first));
  }, [pick]);

  const identifier = toIdentifier(name);
  const value = pick ? valueFor(pick, mode) : undefined;

  return (
    <Sheet
      open={Boolean(pick)}
      onClose={onClose}
      title={t("creator.variables.sheetTitle")}
      description={t("creator.variables.sheetDescription")}
      closeLabel={t("action.close")}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button
            className="flex-1"
            disabled={!identifier || !pick || modes.length === 0}
            onClick={() =>
              pick &&
              onConfirm(
                createVariable(
                  identifier,
                  {
                    kind: "element",
                    selector: pick.selector,
                    read: mode
                  },
                  value
                )
              )
            }
          >
            {t("creator.variables.add")}
          </Button>
        </>
      }
    >
      {pick && (
        <div className="flex flex-col gap-5">
          {modes.length > 1 && (
            <Segmented<CreatorReadMode>
              label={t("creator.variables.read")}
              value={mode}
              onChange={(next) => {
                setMode(next);
                setName((current) => current || suggestName(pick, next));
              }}
              options={modes.map((entry) => ({
                value: entry,
                label: t(READ_KEYS[entry])
              }))}
            />
          )}
          <div className="flex flex-col gap-1.5 rounded-md bg-hover p-3">
            <span className="text-label-sm text-muted">{t("creator.variables.found")}</span>
            {mode === "image" && value ? (
              <img src={value} alt="" className="max-h-28 self-start rounded-md" />
            ) : (
              <span className="text-body-sm break-words">{value ?? t("creator.variables.empty")}</span>
            )}
            <span className="truncate font-mono text-label-sm text-muted">{pick.selector}</span>
          </div>
          <Field
            label={t("creator.variables.name")}
            hint={
              identifier
                ? t("creator.variables.nameHint", { token: `{${identifier}}` })
                : t("creator.variables.nameEmpty")
            }
          >
            <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={t("creator.variables.namePlaceholder")} />
          </Field>
        </div>
      )}
    </Sheet>
  );
};