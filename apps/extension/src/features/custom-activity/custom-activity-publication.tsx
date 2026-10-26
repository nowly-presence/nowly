import { useEffect, useState } from "react";
import { RiShareForwardLine } from "@remixicon/react";
import { FeatureReveal } from "@/components/shared/feature-reveal";
import { useI18n } from "@/hooks/i18n-provider";
import { Button } from "@/ui/button";
import { sendMessage } from "@/lib/messages";
import { CustomActivityPublicationDialog } from "./custom-activity-publication-dialog";

export const CustomActivityPublication = ({ id }: {
  id: string;
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [published, setPublished] = useState(false);
  useEffect(() => {
    if (open) return;

    let cancelled = false;
    const load = () =>
      void sendMessage("GET_OWN_ACTIVITY_PUBLICATION", { id })
        .then((result) => {
          if (!cancelled && result.ok) setPublished(Boolean(result.url && result.published));
        })
        .catch(() => {});
    load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, [id, open]);
  return (
    <>
      <FeatureReveal id="custom-public-sharing" version="2.5.0" text={t("custom.public.description")}>
        <Button className="w-full" icon={<RiShareForwardLine className="size-4" />} onClick={() => setOpen(true)}>
          {t(published ? "custom.public.updateTitle" : "custom.public.share")}
        </Button>
      </FeatureReveal>
      {open && <CustomActivityPublicationDialog id={id} onClose={() => setOpen(false)} />}
    </>
  );
};