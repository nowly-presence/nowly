import { BackButton } from "@/components/shared/back-button"
import { t } from "@/shared/i18n"

type Props = {
  title: string
  onBack: () => void
}

export const SettingsSectionHeader = ({ title, onBack }: Props): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <BackButton onClick={onBack} label={t("back")} />
    <h1 className="min-w-0 truncate text-base font-semibold text-foreground">{title}</h1>
  </div>
)
