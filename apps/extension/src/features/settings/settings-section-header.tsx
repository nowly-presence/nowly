import { RiArrowLeftSLine } from "@remixicon/react"
import { t } from "@/shared/i18n"
import { Button } from "@/ui/button"

type Props = {
  title: string
  onBack: () => void
}

// Shared back button + page title used by every dedicated settings section
// page, mirroring PresenceDetailView's own back-navigation pattern.
export const SettingsSectionHeader = ({ title, onBack }: Props): React.JSX.Element => (
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label={t("back")} className="-ml-1">
      <RiArrowLeftSLine />
    </Button>
    <h1 className="min-w-0 truncate text-base font-semibold text-foreground">{title}</h1>
  </div>
)
