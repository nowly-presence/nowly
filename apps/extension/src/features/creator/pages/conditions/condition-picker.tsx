import { RiAddLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { BUTTON_ACTION_KINDS } from "@nowly/presence-creator/creator-conditions";
import type { CreatorConditionActionKind, CreatorPage } from "@nowly/presence-creator/creator-types";
import { Group } from "@/ui/card";
import { IconTile } from "@/ui/icon-tile";
import { Row } from "@/ui/row";
import { ACTION_GROUPS, ACTION_META } from "@/components/shared/condition-action-meta";

const KINDS = Object.keys(ACTION_META) as CreatorConditionActionKind[];

export const ConditionPicker = ({ page, onPick }: {
  page: CreatorPage;
  onPick: (kind: CreatorConditionActionKind) => void;
}) => {
  const { t } = useI18n();
  const available = KINDS.filter((kind) => page.buttons.length > 0 || !BUTTON_ACTION_KINDS.includes(kind));

  return (
    <div className="flex flex-col gap-4">
      {ACTION_GROUPS.map((group) => {
        const kinds = available.filter((kind) => ACTION_META[kind].group === group);
        return (
          <div key={group} className="flex flex-col gap-1.5">
            <h4 className="px-1 text-label-md font-medium text-muted">{t(`creator.conditions.group.${group}`)}</h4>
            {kinds.length === 0 ? (
              <p className="px-1 text-label-md text-muted">{t("creator.conditions.needsButton")}</p>
            ) : (
              <Group>
                {kinds.map((kind) => (
                  <Row
                    key={kind}
                    leading={<IconTile icon={ACTION_META[kind].icon} />}
                    title={t(`creator.conditions.action.${kind}.label`)}
                    description={t(`creator.conditions.action.${kind}.hint`)}
                    trailing={<RiAddLine className="size-4 text-primary" aria-hidden />}
                    onClick={() => onPick(kind)}
                  />
                ))}
              </Group>
            )}
          </div>
        );
      })}
    </div>
  );
};