import { useI18n } from "@/hooks/i18n-provider"
import { Button } from "@/ui/button"
import { Sheet } from "@/ui/sheet"

type PresenceUninstallSheetProps = { name: string; open: boolean; pending: boolean; onClose: () => void; onConfirm: () => void }

export const PresenceUninstallSheet = ({ name, open, pending, onClose, onConfirm }: PresenceUninstallSheetProps) => {
  const { t } = useI18n()
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("detail.uninstallTitle", { name })}
      description={t("detail.uninstallDescription")}
      closeLabel={t("action.close")}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button variant="destructive" className="flex-1" loading={pending} onClick={onConfirm}>
            {t("detail.uninstall")}
          </Button>
        </>
      }
    />
  )
}
