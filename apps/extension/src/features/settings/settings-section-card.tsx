import { RiArrowRightSLine } from "@remixicon/react"
import type { RemixiconComponentType } from "@remixicon/react"

type Props = {
  icon: RemixiconComponentType
  title: string
  description: string
  onOpen: () => void
}

export const SettingsSectionCard = ({ icon: Icon, title, description, onOpen }: Props): React.JSX.Element => (
  <button type="button" onClick={onOpen} className="flex w-full min-w-0 items-center gap-3 px-3 py-3 text-left outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
      <Icon className="size-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
      <span className="block truncate text-xs text-muted-foreground">{description}</span>
    </span>
    <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
  </button>
)
