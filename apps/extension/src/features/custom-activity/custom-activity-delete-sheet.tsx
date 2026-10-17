import { useI18n } from "@/hooks/i18n-provider";
import { Button } from "@/ui/button";
import { Sheet } from "@/ui/sheet";

type CustomActivityDeleteSheetProps = {
  name: string;
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const CustomActivityDeleteSheet = ({ name, open, pending, onClose, onConfirm }: CustomActivityDeleteSheetProps) => {
  const { t } = useI18n();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("custom.delete.title", { name })}
      description={t("custom.delete.description")}
      closeLabel={t("action.close")}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button variant="destructive" className="flex-1" loading={pending} onClick={onConfirm}>
            {t("action.delete")}
          </Button>
        </>
      }
    />
  );
};