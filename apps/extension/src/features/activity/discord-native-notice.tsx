import { RiInformationLine } from "@remixicon/react"
import { HeadingText } from "@/components/shared/heading-text"
import { t } from "@/shared/i18n"

type Props = {
  name: string
}

export const DiscordNativeNotice = ({ name }: Props): React.JSX.Element => (
  <section className="flex gap-2.5 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3">
    <RiInformationLine className="mt-0.5 size-4 shrink-0 text-accent" />
    <HeadingText title={t("discord-native-title")} description={t("discord-native-description", { name })} className="min-w-0" />
  </section>
)
