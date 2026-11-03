import { RiMegaphoneLine, RiShieldCheckLine, RiStackLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { SettingsIcon } from "@/features/settings/settings-icon";

const ICON_CLASS = "size-[18px] text-muted";

export const AdminSection = () => {
  const { t } = useI18n();
  const { push } = useNav();
  const staff = useStaffAccess();

  if (!staff.isStaff) return null;

  return (
    <Section title={t("admin.title")}>
      <Group>
        {!staff.access?.granted && (
          <Row
            leading={<SettingsIcon icon={<RiShieldCheckLine className={ICON_CLASS} />} />}
            title={t("admin.allowTitle")}
            description={t("admin.allowHint")}
            align="start"
            trailing={
              <Button size="sm" loading={staff.connecting} onClick={() => void staff.connect()}>
                {t("admin.allow")}
              </Button>
            }
          />
        )}
        {staff.can("review") && (
          <Row
            leading={<SettingsIcon icon={<RiStackLine className={ICON_CLASS} />} />}
            title={t("admin.queue")}
            description={t("admin.queueHint")}
            chevron
            onClick={() => push({ name: "admin" })}
          />
        )}
        {staff.can("announce") && (
          <Row
            leading={<SettingsIcon icon={<RiMegaphoneLine className={ICON_CLASS} />} />}
            title={t("admin.newAnnouncement")}
            chevron
            onClick={() => push({ name: "admin-announcement" })}
          />
        )}
      </Group>
    </Section>
  );
};