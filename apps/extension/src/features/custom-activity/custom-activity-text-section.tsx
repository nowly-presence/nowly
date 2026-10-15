import { useI18n, type MessageKey } from "@/hooks/i18n-provider"
import { CUSTOM_ACTIVITY_TYPES, CUSTOM_TEXT_MAX_LENGTH } from "@/shared/custom-activity"
import type { CustomActivityType } from "@/shared/types"
import { Group } from "@/ui/card"
import { FieldRow } from "@/ui/field-row"
import { Input } from "@/ui/input"
import { Section } from "@/ui/section"
import { Select } from "@/ui/select"
import { FieldError } from "@/features/custom-activity/custom-field-error"
import type { CustomActivitySectionProps } from "@/features/custom-activity/custom-activity-section-props"

const TYPE_LABELS: Record<CustomActivityType, MessageKey> = {
  0: "activity.type.playing",
  2: "activity.type.listening",
  3: "activity.type.watching",
  5: "activity.type.competing",
}

const isActivityType = (value: number): value is CustomActivityType => CUSTOM_ACTIVITY_TYPES.some((type) => type === value)

export const CustomActivityTextSection = ({ draft, patch, errors }: CustomActivitySectionProps) => {
  const { t } = useI18n()
  return (
    <Section title={t("custom.editor.textSection")}>
      <Group>
        <FieldRow layout="stacked" title={t("custom.field.name")} description={t("custom.field.nameHint")}>
          <Input value={draft.name} maxLength={CUSTOM_TEXT_MAX_LENGTH} placeholder={t("custom.field.namePlaceholder")} onChange={(event) => patch({ name: event.target.value })} aria-invalid={Boolean(errors.name)} />
          <FieldError error={errors.name} />
        </FieldRow>
        <FieldRow title={t("custom.field.type")} description={t("custom.field.typeHint")}>
          <Select
            aria-label={t("custom.field.type")}
            value={String(draft.type)}
            options={CUSTOM_ACTIVITY_TYPES.map((type) => ({ value: String(type), label: t(TYPE_LABELS[type]) }))}
            onChange={(value) => {
              const type = Number(value)
              if (isActivityType(type)) patch({ type })
            }}
          />
        </FieldRow>
        <FieldRow layout="stacked" title={t("custom.field.details")} description={t("custom.field.detailsHint")}>
          <Input value={draft.details} maxLength={CUSTOM_TEXT_MAX_LENGTH} placeholder={t("custom.field.detailsPlaceholder")} onChange={(event) => patch({ details: event.target.value })} />
          <FieldError error={errors.details} />
        </FieldRow>
        <FieldRow layout="stacked" title={t("custom.field.state")} description={t("custom.field.stateHint")}>
          <Input value={draft.state} maxLength={CUSTOM_TEXT_MAX_LENGTH} placeholder={t("custom.field.statePlaceholder")} onChange={(event) => patch({ state: event.target.value })} />
          <FieldError error={errors.state} />
        </FieldRow>
      </Group>
    </Section>
  )
}
