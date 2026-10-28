import { RiAddLine, RiLayoutGridLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { EmptyState } from "@/ui/empty-state";
import { RiSparkling2Line } from "@remixicon/react";

export const CustomActivityEmptyState = ({ onCreate, onTemplates }: {
  onCreate: () => void;
  onTemplates: () => void;
}) => {
  const { t } = useI18n();

  return (
    <Card className="overflow-hidden">
      <EmptyState
        icon={<RiSparkling2Line className="size-5" />}
        title={t("custom.empty.title")}
        description={t("custom.empty.description")}
        className="gap-4 px-5 py-6"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button icon={<RiAddLine />} onClick={onCreate}>
              {t("custom.empty.action")}
            </Button>
            <Button variant="secondary" icon={<RiLayoutGridLine />} onClick={onTemplates}>
              {t("custom.empty.templates")}
            </Button>
          </div>
        }
      />
    </Card>
  );
};