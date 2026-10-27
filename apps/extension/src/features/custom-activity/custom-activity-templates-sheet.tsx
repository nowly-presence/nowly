import type { ReactNode } from "react";
import { RiAddLine } from "@remixicon/react";
import { CustomActivityGlyph } from "@/components/shared/custom-activity-artwork";
import { useI18n } from "@/hooks/i18n-provider";
import { Sheet } from "@/ui/sheet";
import { CUSTOM_ACTIVITY_TEMPLATE_IDS, CUSTOM_ACTIVITY_TEMPLATES, templateText, type CustomActivityTemplateId } from "@/features/custom-activity/custom-activity-templates";

type CustomActivityTemplatesSheetProps = {
  open: boolean;
  onClose: () => void;
  onPick: (template: CustomActivityTemplateId | null) => void;
};

const GLYPH_SIZE = 36;

const Tile = ({ icon, title, line, onClick }: { icon: ReactNode; title: string; line: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-hover active:bg-press"
  >
    {icon}
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-label-lg font-medium text-ink">{title}</span>
      <span className="truncate text-label-md text-muted">{line}</span>
    </span>
  </button>
);

export const CustomActivityTemplatesSheet = ({ open, onClose, onPick }: CustomActivityTemplatesSheetProps) => {
  const { t } = useI18n();
  return (
    <Sheet open={open} onClose={onClose} title={t("custom.templates.title")} description={t("custom.templates.description")} closeLabel={t("action.close")}>
      <div className="grid grid-cols-2 gap-2">
        <Tile
          icon={
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-dashed border-line-strong text-muted">
              <RiAddLine />
            </span>
          }
          title={t("custom.templates.blank")}
          line={t("custom.templates.blankHint")}
          onClick={() => onPick(null)}
        />
        {CUSTOM_ACTIVITY_TEMPLATE_IDS.map((id) => {
          const template = CUSTOM_ACTIVITY_TEMPLATES[id];
          const text = templateText(id, t);
          return (
            <Tile
              key={id}
              icon={<CustomActivityGlyph color={template.color} icon={template.icon} size={GLYPH_SIZE} />}
              title={text.name}
              line={text.details}
              onClick={() => onPick(id)}
            />
          );
        })}
      </div>
    </Sheet>
  );
};