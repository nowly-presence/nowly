import { RiArrowLeftSLine } from "@remixicon/react"
import { Button } from "@/ui/button"

type Props = {
  onClick: () => void
  label: string
}

export const BackButton = ({ onClick, label }: Props): React.JSX.Element => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className="w-fit"
  >
    <RiArrowLeftSLine className="size-4" />
    {label}
  </Button>
)
