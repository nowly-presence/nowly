import { RiExternalLinkLine, RiSmartphoneLine } from "@remixicon/react";
import { Button } from "@/ui/button";
import { useI18n } from "@/hooks/i18n-provider";
import { useResolvedTheme } from "@/hooks/use-theme";
import { brandLockup } from "@/shared/brand";
import { openUrl, siteUrl } from "@/shared/browser-links";

const LOGO_HEIGHT_CLASS = "h-[22px]";

export const UnavailableView = () => {
  const { t } = useI18n();
  const theme = useResolvedTheme(undefined);

  return (
    <main className="flex h-full flex-col bg-canvas px-4 pb-4">
      <header className="flex h-14 items-center">
        <img src={brandLockup(theme === "dark" ? "white" : "blue")} alt="Nowly" className={`${LOGO_HEIGHT_CLASS} w-auto select-none`} draggable={false} />
      </header>
      <div className="flex flex-1 flex-col gap-3 pt-4">
        <span className="flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary">
          <RiSmartphoneLine className="size-5" />
        </span>
        <h1 className="text-headline-sm font-medium tracking-[-0.3px] text-balance">{t("unavailable.title")}</h1>
        <p className="text-body-sm text-muted">{t("unavailable.description")}</p>
      </div>
      <Button className="w-full" icon={<RiExternalLinkLine className="size-4" />} onClick={() => openUrl(siteUrl("/"))}>
        {t("unavailable.visitSite")}
      </Button>
    </main>
  );
};