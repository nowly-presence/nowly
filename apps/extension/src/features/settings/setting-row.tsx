import type { ReactNode } from "react"

type Props = {
  title: string
  description?: string
  control: ReactNode
  children?: ReactNode
}

// Shared "label + description + control" row shape used across every
// settings section - ~15 rows share this exact layout.
export const SettingRow = ({ title, description, control, children }: Props): React.JSX.Element => (
  <div className="flex flex-col gap-2 px-4 py-3.5">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</p> : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
    {children}
  </div>
)
