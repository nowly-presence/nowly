import type { ReactNode } from "react"
import { HeadingText } from "@/components/shared/heading-text"
import { SettingsBlock } from "@/features/settings/settings-block"

type Props = {
  title: string
  description?: string
  // Omit when the row has no side control (e.g. a title/description
  // followed by a full-width action in `children` instead).
  control?: ReactNode
  children?: ReactNode
}

// Every settings row - single control on the right, or a plain heading
// followed by arbitrary content - shares this exact shape. One place to
// change the title/description rhythm or the row padding for all of them.
export const SettingRow = ({ title, description, control, children }: Props): React.JSX.Element => (
  <SettingsBlock className="flex flex-col gap-2">
    {control ? (
      <div className="flex items-center justify-between gap-3">
        <HeadingText title={title} description={description} className="min-w-0" />
        <div className="shrink-0">{control}</div>
      </div>
    ) : (
      <HeadingText title={title} description={description} />
    )}
    {children}
  </SettingsBlock>
)
