import { RiShieldUserLine } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { Group } from "@/ui/card"
import { Row } from "@/ui/row"

export const DiscordIpcAlert = () => {
  const { t } = useI18n()
  const { push } = useNav()

  return (
    <Group>
      <Row
        leading={
          <span className="flex size-9 items-center justify-center rounded-md bg-danger-soft text-danger">
            <RiShieldUserLine className="size-[18px]" />
          </span>
        }
        title={t("discordIpc.title")}
        description={t("discordIpc.alertDescription")}
        chevron
        onClick={() => push({ name: "discord-ipc" })}
      />
    </Group>
  )
}
