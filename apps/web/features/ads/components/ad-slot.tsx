import { AdUnit } from "@/features/ads/components/ad-unit";
import { adsenseClientId, adsenseSlot, type AdPlacement } from "@/features/ads/lib/adsense";
import { cn } from "@nowly/ui/utils";
import { getTranslations } from "next-intl/server";

// Renders nothing until NEXT_PUBLIC_ADSENSE_ENABLED=true and the placement has a slot ID,
// so the AdSense script (and its cookies) never loads on a build without ads.
export const AdSlot = async ({ placement, className }: { placement: AdPlacement; className?: string }) => {
  const client = adsenseClientId();
  const slot = adsenseSlot(placement);
  if (!client || !slot) return null;

  const t = await getTranslations("ads");
  return (
    <aside aria-label={t("label")} className={cn("mx-auto w-full max-w-3xl", className)}>
      <AdUnit client={client} slot={slot} label={t("label")} />
    </aside>
  );
};
