import { RiCupLine, RiExternalLinkLine, RiGithubLine } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import { openUrl } from "@/shared/browser-links"
import { GITHUB_SPONSORS_URL, KOFI_URL } from "@/shared/constants"
import { Group } from "@/ui/card"
import { Row } from "@/ui/row"
import { Sheet } from "@/ui/sheet"

const ICON_CLASS = "size-[18px] text-muted"

export const SupportSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useI18n()
  const trailing = <RiExternalLinkLine className="size-4 text-muted" />

  return (
    <Sheet open={open} onClose={onClose} title={t("support.rowTitle")} description={t("support.sheetDescription")} closeLabel={t("action.close")}>
      <Group>
        <Row leading={<RiCupLine className={ICON_CLASS} />} title="Ko-fi" description={t("support.kofiHint")} onClick={() => openUrl(KOFI_URL)} trailing={trailing} />
        <Row
          leading={<RiGithubLine className={ICON_CLASS} />}
          title="GitHub Sponsors"
          description={t("support.sponsorsHint")}
          onClick={() => openUrl(GITHUB_SPONSORS_URL)}
          trailing={trailing}
        />
      </Group>
    </Sheet>
  )
}
