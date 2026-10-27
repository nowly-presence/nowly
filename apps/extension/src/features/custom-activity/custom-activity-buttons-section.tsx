import { RiAddLine, RiCloseLine, RiLink } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { CUSTOM_BUTTON_LABEL_MAX_LENGTH, CUSTOM_BUTTONS_MAX } from "@/shared/custom-activity";
import type { CustomActivityButton } from "@/shared/types";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { Input } from "@/ui/input";
import { Section } from "@/ui/section";
import { FieldError } from "@/features/custom-activity/custom-field-error";
import type { CustomActivitySectionProps } from "@/features/custom-activity/custom-activity-section-props";

export const CustomActivityButtonsSection = ({ draft, patch, errors }: CustomActivitySectionProps) => {
  const { t } = useI18n();
  const { buttons } = draft;

  const update = (index: number, partial: Partial<CustomActivityButton>) =>
    patch({ buttons: buttons.map((button, position) => (position === index ? { ...button, ...partial } : button)) });

  return (
    <Section title={t("custom.editor.buttonsSection")}>
      <Group>
        {buttons.map((button, index) => (
          <div key={index} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-label-lg font-medium">{t("custom.button.title", { index: index + 1 })}</span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t("custom.button.remove")}
                title={t("custom.button.remove")}
                onClick={() => patch({ buttons: buttons.filter((_, position) => position !== index) })}
              >
                <RiCloseLine />
              </Button>
            </div>
            <Input
              value={button.label}
              maxLength={CUSTOM_BUTTON_LABEL_MAX_LENGTH}
              placeholder={t("custom.button.labelPlaceholder")}
              aria-label={t("custom.button.label")}
              onChange={(event) => update(index, { label: event.target.value })}
            />
            <FieldError error={errors[`button${index}Label`]} />
            <Input
              type="url"
              inputMode="url"
              value={button.url}
              placeholder="https://"
              leading={<RiLink />}
              aria-label={t("custom.button.url")}
              onChange={(event) => update(index, { url: event.target.value })}
            />
            <FieldError error={errors[`button${index}Url`]} />
          </div>
        ))}
        {buttons.length < CUSTOM_BUTTONS_MAX && (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-label-md text-muted">
              {buttons.length === 0
                ? t("custom.button.hint", { count: CUSTOM_BUTTONS_MAX })
                : t("custom.button.remaining", { count: CUSTOM_BUTTONS_MAX - buttons.length })}
            </span>
            <Button
              size="sm"
              variant="secondary"
              icon={<RiAddLine />}
              onClick={() =>
                patch({
                  buttons: [
                    ...buttons,
                    {
                      label: "",
                      url: ""
                    }
                  ]
                })
              }
            >
              {t("custom.button.add")}
            </Button>
          </div>
        )}
      </Group>
    </Section>
  );
};
