import { useI18n } from "@/hooks/i18n-provider";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";

export const PresenceDeleteSheet = ({ name, open, pending, onClose, onConfirm }: {
  name: string;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const { t } = useI18n();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("admin.presence.deleteTitle", { name })}
      description={t("admin.presence.deleteDescription")}
      closeLabel={t("action.close")}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button variant="destructive" className="flex-1" loading={pending} onClick={onConfirm}>
            {t("admin.presence.delete")}
          </Button>
        </>
      }
    />
  );
};
