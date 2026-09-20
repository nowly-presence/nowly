import type { ReactNode } from "react"
import { cn } from "@/ui/utils"

type Props = {
  className?: string
  children: ReactNode
}

export const SettingsBlock = ({ className, children }: Props): React.JSX.Element => <div className={cn("px-4 py-3", className)}>{children}</div>
