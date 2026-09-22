"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@nowly/ui";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const STORAGE_KEY = "nowly_cookie_dismissed";

export const CookieBanner = () => {
  const t = useTranslations("cookie-banner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[75rem] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("message")}{" "}
          <Link
            href="/cookies"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            {t("learn-more")}
          </Link>
        </p>

        <Button type="button" variant="inverted" className="shrink-0" onClick={dismiss}>
          {t("dismiss")}
        </Button>
      </div>
    </div>
  );
};
