import { RiLink } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { FieldError } from "@/features/custom-activity/custom-field-error";
import type { CustomActivitySectionProps } from "@/features/custom-activity/custom-activity-section-props";
import { Group } from "@/ui/card";
import { FieldRow } from "@/ui/field-row";
import { Input } from "@/ui/input";
import { LiveDot } from "@/ui/live-dot";
import { Section } from "@/ui/section";

export const CustomActivityDetectionSection = ({ draft, patch, errors, detectedHost }: CustomActivitySectionProps & {
  detectedHost?: string;
}) => {
  const { t } = useI18n();
  return (
    <Section title={t("custom.editor.detectionSection")}>
      <Group>
        <FieldRow layout="stacked" spacing="relaxed" title={t("custom.field.detection")} description={t("custom.field.detectionHint")}>
          <Input
            type="url"
            inputMode="url"
            value={draft.detectionUrl}
            placeholder={t("custom.field.detectionPlaceholder")}
            leading={<RiLink />}
            aria-label={t("custom.field.detection")}
            onChange={(event) => patch({ detectionUrl: event.target.value })}
          />
          <FieldError error={errors.detectionUrl} />
          {detectedHost && (
            <span className="flex items-center gap-1.5 text-label-md text-success">
              <LiveDot />
              {t("custom.live.detectedOn", { host: detectedHost })}
            </span>
          )}
        </FieldRow>
      </Group>
    </Section>
  );
};