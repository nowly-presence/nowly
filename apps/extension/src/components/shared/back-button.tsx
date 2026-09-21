import { RiArrowLeftSLine } from "@remixicon/react"
import { Button } from "@/ui/button"

type Props = {
  onClick: () => void
  label: string
}

export const BackButton = ({ onClick, label }: Props): React.JSX.Element => (
  <Button
    variant="ghost"
    size="icon-sm"
    onClick={onClick}
    aria-label={label}
    className="-ml-1 shrink-0"
  >
    <RiArrowLeftSLine className="size-4" />
  </Button>
)
