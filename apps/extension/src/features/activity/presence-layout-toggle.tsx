import { RiLayoutGridLine, RiListUnordered } from "@remixicon/react"
import { Button } from "@/ui/button"
import { cn } from "@/ui/utils"
import { t } from "@/shared/i18n"
import type { PresenceDisplayMode } from "@/shared/types"

type Props = {
  value: PresenceDisplayMode
  onChange: (mode: PresenceDisplayMode) => void
}

const OPTIONS: { id: PresenceDisplayMode; icon: typeof RiListUnordered; labelKey: "display-list" | "display-grid" }[] = [
  { id: "category", icon: RiListUnordered, labelKey: "display-list" },
  { id: "grid", icon: RiLayoutGridLine, labelKey: "display-grid" },
]

export const PresenceLayoutToggle = ({ value, onChange }: Props): React.JSX.Element => (
  <div role="group" aria-label={t("display")} className="inline-flex h-8 shrink-0 items-center rounded-lg bg-secondary p-0.5">
    {OPTIONS.map((option) => (
      <Button
        key={option.id}
        variant="ghost"
        size="icon-sm"
        aria-label={t(option.labelKey)}
        aria-pressed={value === option.id}
        onClick={() => onChange(option.id)}
        className={cn("rounded-md bg-transparent", value === option.id ? "bg-background text-foreground" : "text-muted-foreground")}
      >
        <option.icon className="size-3.5" />
      </Button>
    ))}
  </div>
)
