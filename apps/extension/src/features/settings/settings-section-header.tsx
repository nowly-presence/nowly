import { BackButton } from "@/components/shared/back-button"

type Props = {
  title: string
  onBack: () => void
}

export const SettingsSectionHeader = ({ title, onBack }: Props): React.JSX.Element => (
  <div className="flex items-center gap-1">
    <BackButton onClick={onBack} />
    <h1 className="min-w-0 truncate text-base font-semibold text-foreground">{title}</h1>
  </div>
)
