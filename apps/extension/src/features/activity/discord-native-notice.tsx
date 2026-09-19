import { RiInformationLine } from "@remixicon/react"
import { t } from "@/shared/i18n"

type Props = {
  name: string
}

export const DiscordNativeNotice = ({ name }: Props): React.JSX.Element => (
  <section className="flex gap-2.5 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3">
    <RiInformationLine className="mt-0.5 size-4 shrink-0 text-accent" />
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{t("discord-native-title")}</p>
      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{t("discord-native-description", { name })}</p>
    </div>
  </section>
)
