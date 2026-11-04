import { useState } from "react";
import { RiDeleteBinLine, RiEyeOffLine } from "@remixicon/react";
import { PresenceDeleteSheet } from "@/components/shared/presence-delete-sheet";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { usePresenceModeration } from "@/hooks/use-presence-moderation";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { Row } from "@/ui/row";

export const PresenceModerationActions = ({ slug, name }: {
  slug: string;
  name: string;
}) => {
  const { t } = useI18n();
  const { pop } = useNav();
  const staff = useStaffAccess();
  const moderation = usePresenceModeration(pop);
  const [confirming, setConfirming] = useState(false);

  if (!staff.can("publish")) return null;

  return (
    <>
      <Group>
        <Row
          title={t("admin.presence.hide")}
          description={t("admin.presence.hideHint")}
          align="start"
          trailing={
            <Button size="sm" variant="secondary" icon={<RiEyeOffLine className="size-4" />} loading={moderation.busy === "hide"} onClick={() => void moderation.hide(slug)}>
              {t("admin.presence.hideAction")}
            </Button>
          }
        />
        <Row
          title={t("admin.presence.delete")}
          description={t("admin.presence.deleteHint")}
          align="start"
          trailing={
            <Button size="sm" variant="danger" icon={<RiDeleteBinLine className="size-4" />} onClick={() => setConfirming(true)}>
              {t("action.erase")}
            </Button>
          }
        />
      </Group>
      <PresenceDeleteSheet
        name={name}
        open={confirming}
        pending={moderation.busy === "delete"}
        onClose={() => setConfirming(false)}
        onConfirm={() => void moderation.remove(slug)}
      />
    </>
  );
};
