import { RiDeleteBinLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { isImageVariable, isLinkVariable } from "@nowly/presence-creator/creator-activity";
import { textIn } from "@nowly/presence-creator/creator-draft";
import { BUTTON_LABEL_MAX_LENGTH, PAGE_TEXT_MAX_LENGTH } from "@nowly/presence-creator/creator-schema";
import type { CreatorActivityType, CreatorConditionAction, CreatorPage, CreatorTimestamps, LocalizedText } from "@nowly/presence-creator/creator-types";
import type { LongLocale } from "@/shared/locales";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { OptionCards } from "@/ui/option-cards";
import { Select } from "@/ui/select";
import { TemplateInput } from "@/features/creator/pages/template-input";
import { UrlSourceField } from "@/features/creator/pages/url-source-field";
import { ACTION_META, buttonOptions } from "@/components/shared/condition-action-meta";

const ACTIVITY_TYPES: CreatorActivityType[] = ["watching", "listening", "playing", "competing"];
const TIMESTAMPS: CreatorTimestamps[] = ["elapsed", "media"];

type ActionChange = (action: CreatorConditionAction, page?: CreatorPage) => void;

type ActionBodyProps = {
  page: CreatorPage;
  action: CreatorConditionAction;
  locale: LongLocale;
  base: LongLocale;
  onChange: ActionChange;
};

const ActionBody = ({ page, action, locale, base, onChange }: ActionBodyProps) => {
  const { t } = useI18n();
  const textVariables = page.variables.filter((variable) => !isImageVariable(variable));

  const textInput = (text: LocalizedText, maxLength: number, change: (text: LocalizedText) => void) => (
    <TemplateInput
      label={t("creator.conditions.newText")}
      value={text[locale] ?? ""}
      placeholder={locale !== base ? textIn(text, base) || t("creator.conditions.textPlaceholder") : t("creator.conditions.textPlaceholder")}
      maxLength={maxLength}
      variables={textVariables}
      onChange={(value) =>
        change({
          ...text,
          [locale]: value
        })
      }
    />
  );

  const buttonSelect = (buttonId: string, change: (buttonId: string) => void) => (
    <Field label={t("creator.conditions.button")}>
      <Select value={buttonId} options={buttonOptions(page, base, t)} onChange={change} aria-label={t("creator.conditions.button")} />
    </Field>
  );

  switch (action.kind) {
    case "details":
    case "state":
    case "activityName":
    case "imageText":
      return textInput(action.text, PAGE_TEXT_MAX_LENGTH, (text) => onChange({ ...action, text }));
    case "largeImage":
      return (
        <UrlSourceField
          read="image"
          label={t("creator.page.image")}
          defaultLabel={t("creator.page.imageLogo")}
          value={action.image.kind === "logo" ? { kind: "default" } : action.image}
          page={page}
          candidates={page.variables.filter(isImageVariable)}
          onChange={(next, source) =>
            onChange(
              {
                ...action,
                image: source.kind === "default" ? { kind: "logo" } : source
              },
              next
            )
          }
        />
      );
    case "smallImage":
      return (
        <UrlSourceField
          read="image"
          label={t("creator.page.image")}
          defaultLabel={t("creator.conditions.smallIcon")}
          value={action.image.kind === "icon" ? { kind: "default" } : action.image}
          page={page}
          candidates={page.variables.filter(isImageVariable)}
          onChange={(next, source) =>
            onChange(
              {
                ...action,
                image: source.kind === "default" ? { kind: "icon" } : source
              },
              next
            )
          }
        />
      );
    case "activityType":
      return (
        <OptionCards<CreatorActivityType>
          size="xs"
          columns={2}
          label={t("creator.conditions.action.activityType.label")}
          value={action.activityType}
          onValueChange={(activityType) => onChange({ ...action, activityType })}
          options={ACTIVITY_TYPES.map((value) => ({
            value,
            label: t(`activity.type.${value}`)
          }))}
        />
      );
    case "timestamps":
      return (
        <OptionCards<CreatorTimestamps>
          size="xs"
          columns={2}
          label={t("creator.page.timestamps")}
          value={action.timestamps}
          onValueChange={(timestamps) => onChange({ ...action, timestamps })}
          options={TIMESTAMPS.map((value) => ({
            value,
            label: t(value === "media" ? "creator.page.timestampsMedia" : "creator.page.timestampsElapsed")
          }))}
        />
      );
    case "hideButton":
      return buttonSelect(action.buttonId, (buttonId) => onChange({ ...action, buttonId }));
    case "buttonLabel":
      return (
        <div className="flex flex-col gap-3">
          {buttonSelect(action.buttonId, (buttonId) => onChange({ ...action, buttonId }))}
          {textInput(action.text, BUTTON_LABEL_MAX_LENGTH, (text) => onChange({ ...action, text }))}
        </div>
      );
    case "buttonLink":
      return (
        <div className="flex flex-col gap-3">
          {buttonSelect(action.buttonId, (buttonId) => onChange({ ...action, buttonId }))}
          <UrlSourceField
            read="link"
            label={t("creator.texts.buttonLink")}
            defaultLabel={t("creator.source.currentPage")}
            value={action.link.kind === "page" ? { kind: "default" } : action.link}
            page={page}
            candidates={page.variables.filter(isLinkVariable)}
            onChange={(next, source) =>
              onChange(
                {
                  ...action,
                  link: source.kind === "default" ? { kind: "page" } : source
                },
                next
              )
            }
          />
        </div>
      );
    case "hidePresence":
      return (
        <p className="text-label-md text-muted">
          {t("creator.conditions.hidePresenceHint")}
        </p>
      );
  }
};

export const ConditionActionCard = ({ onRemove, ...props }: ActionBodyProps & {
  onRemove: () => void;
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col rounded-md border border-line bg-surface">
      <div className="flex items-center gap-2.5 py-2 pr-2 pl-3">
        {ACTION_META[props.action.kind].icon}
        <span className="min-w-0 flex-1 truncate text-label-lg font-medium text-ink">{t(`creator.conditions.action.${props.action.kind}.label`)}</span>
        <Button variant="ghost" size="icon-sm" className="hover:text-danger" aria-label={t("creator.conditions.removeAction")} onClick={onRemove}>
          <RiDeleteBinLine className="size-4" />
        </Button>
      </div>
      <div className="border-t border-line p-3">
        <ActionBody {...props} />
      </div>
    </div>
  );
};