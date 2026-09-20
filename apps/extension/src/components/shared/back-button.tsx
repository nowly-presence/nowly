import { RiArrowLeftSLine } from "@remixicon/react"
import { t } from "@/shared/i18n"
import { Button } from "@/ui/button"

type Props = {
  onClick: () => void
  label?: string
}

export const BackButton = ({ onClick, label }: Props): React.JSX.Element =>
  label ? (
    <Button variant="ghost" size="sm" onClick={onClick} className="-ml-2 w-fit">
      <RiArrowLeftSLine className="size-4" />
      {label}
    </Button>
  ) : (
    <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={t("back")} className="-ml-1">
      <RiArrowLeftSLine className="size-4" />
    </Button>
  )
