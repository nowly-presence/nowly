"use client";

import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@nowly/ui/button-variants";
import { cn } from "@nowly/ui/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { setSiteConsent, siteConsent } from "@/lib/telemetry";

export const CookieBanner = () => {
  const t = useTranslations("cookie-banner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(siteConsent() === null);
    update();
    window.addEventListener("nowly:product-consent", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("nowly:product-consent", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const choose = (granted: boolean) => {
    setSiteConsent(granted);
    setVisible(siteConsent() === null);
  };

  if (!visible) return null;

  return (
    <aside aria-label={t("title")} className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[75rem] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("message")}{" "}
          <Link href="/cookies" className="underline underline-offset-4 transition-colors hover:text-foreground">
            {t("learn-more")}
          </Link>
        </p>

        <div className="flex shrink-0 gap-2">
          <button type="button" className={cn(buttonVariants({ variant: "outline" }))} onClick={() => choose(false)}>
            {t("decline")}
          </button>
          <button type="button" className={cn(buttonVariants({ variant: "outline" }))} onClick={() => choose(true)}>
            {t("accept")}
          </button>
        </div>
      </div>
    </aside>
  );
};