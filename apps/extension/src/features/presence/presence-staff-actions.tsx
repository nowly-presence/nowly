import { RiMagicLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { useCreatorPresenceProbe } from "@/hooks/use-creator-presence-probe";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { Button } from "@/ui/button";

export const PresenceStaffActions = ({ slug }: {
  slug: string;
}) => {
  const { t } = useI18n();
  const { push } = useNav();
  const staff = useStaffAccess();
  const published = useCreatorPresenceProbe(slug, staff.can("review"));

  if (!published) return null;

  return (
    <Button
      variant="secondary"
      icon={<RiMagicLine className="size-4" />}
      className="w-full"
      onClick={() =>
        push({
          name: "creator",
          presenceSlug: slug
        })
      }
    >
      {t("admin.openInCreator")}
    </Button>
  );
};