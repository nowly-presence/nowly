import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { CUSTOM_BUTTON_LABEL_MAX_LENGTH, CUSTOM_COUNTDOWN_MAX_MINUTES, CUSTOM_TEXT_MIN_LENGTH, type CustomActivityError } from "@/shared/custom-activity";

const ERROR_KEYS: Record<CustomActivityError, MessageKey> = {
  required: "custom.error.required",
  tooShort: "custom.error.tooShort",
  tooLong: "custom.error.tooLong",
  httpsOnly: "custom.error.httpsOnly",
  invalidUrl: "custom.error.invalidUrl",
  outOfRange: "custom.error.outOfRange"
};

export const FieldError = ({ error }: {
  error?: CustomActivityError;
}) => {
  const { t } = useI18n();

  if (!error) return null;

  return (
    <p role="alert" className="text-label-md text-danger">
      {t(ERROR_KEYS[error], {
        min: CUSTOM_TEXT_MIN_LENGTH,
        max: CUSTOM_BUTTON_LABEL_MAX_LENGTH,
        hours: CUSTOM_COUNTDOWN_MAX_MINUTES / 60
      })}
    </p>
  );
};