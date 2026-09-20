import type { ReactNode } from "react"
import { cn } from "@/ui/utils"

type Props = {
  className?: string
  children: ReactNode
}

// Shared padded row container for every block inside a settings accordion
// section (SettingRow rows, shortcuts, developer tools, ...) - change the
// row rhythm once here instead of in every section file.
export const SettingsBlock = ({ className, children }: Props): React.JSX.Element => <div className={cn("px-4 py-3", className)}>{children}</div>
