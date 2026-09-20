import type { ReactNode } from "react"
import { HeadingText } from "@/components/shared/heading-text"
import { SettingsBlock } from "@/features/settings/settings-block"

type Props = {
  title: string
  description?: string
  control?: ReactNode
  controlId?: string
  children?: ReactNode
}

export const SettingRow = ({ title, description, control, controlId, children }: Props): React.JSX.Element => (
  <SettingsBlock className="flex flex-col gap-2">
    {control ? (
      <div className="flex items-center justify-between gap-3">
        <HeadingText
          title={title}
          description={description}
          className="min-w-0"
          titleFor={controlId}
        />
        <div className="shrink-0">{control}</div>
      </div>
    ) : (
      <HeadingText
        title={title}
        description={description}
        titleFor={controlId}
      />
    )}
    {children}
  </SettingsBlock>
)
