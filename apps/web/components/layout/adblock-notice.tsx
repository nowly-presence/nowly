"use client";

import { Button } from "@/components/ui/button";
import { useAdStatus } from "@/providers/ad-status-provider";
import { IconInfoCircle, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FC, type ReactElement } from "react";

const STORAGE_KEY = "nowly_adblock_notice_dismissed";
const DETECTION_DELAY_MS = 1800;
const DISMISS_DELAY_MS = 3000;

type Props = {
  enabled: boolean
};

const wasDismissed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return true;
  }
};

const markDismissed = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures; closing should still hide the notice for this page.
  }
};

const createAdBait = (): HTMLDivElement => {
  const bait = document.createElement("div");
  bait.className = "adsbox ad-banner ad-placement advertisement pub_300x250 textads banner_ads";
  bait.setAttribute("aria-hidden", "true");
  bait.style.cssText = [
    "position:absolute",
    "left:-10000px",
    "top:-10000px",
    "width:1px",
    "height:1px",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(bait);
  return bait;
};

const isAdBaitBlocked = (bait: HTMLDivElement): boolean => {
  const styles = window.getComputedStyle(bait);

  return (
    bait.offsetHeight === 0 ||
    bait.clientHeight === 0 ||
    styles.display === "none" ||
    styles.visibility === "hidden"
  );
};

export const AdblockNotice: FC<Props> = ({ enabled }): ReactElement | null => {
  const t = useTranslations("ads");
  const { loading, hasAds, adFree } = useAdStatus();
  const [visible, setVisible] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    const forceFromUrl = new URLSearchParams(window.location.search).get("adblockNotice") === "1";

    if (loading || !hasAds || adFree) return;
    if (!enabled && !forceFromUrl) return;

    if (forceFromUrl) {
      setVisible(true);
      return;
    }

    if (wasDismissed()) return;

    const bait = createAdBait();
    const timer = window.setTimeout(() => {
      if (isAdBaitBlocked(bait)) {
        setVisible(true);
      }

      bait.remove();
    }, DETECTION_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      bait.remove();
    };
  }, [adFree, enabled, hasAds, loading]);

  useEffect(() => {
    if (!visible) {
      setCanDismiss(false);
      return;
    }

    setCanDismiss(false);
    const timer = window.setTimeout(() => {
      setCanDismiss(true);
    }, DISMISS_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [visible]);

  const dismiss = (): void => {
    if (!canDismiss) return;

    markDismissed();
    setVisible(false);
  };

  if (loading || !hasAds || adFree || !visible) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-6 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-background/95 shadow-2xl shadow-black/30 backdrop-blur-sm"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
            <IconInfoCircle className="size-4" />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t("adblock-message-title")}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("adblock-message")}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={dismiss}
          aria-label={t("adblock-close")}
          aria-hidden={!canDismiss}
          tabIndex={canDismiss ? 0 : -1}
          className={`-mr-2 -mt-2 shrink-0 text-muted-foreground transition-opacity hover:text-foreground hover:opacity-100 focus-visible:opacity-100 ${
            canDismiss ? "opacity-40" : "pointer-events-none opacity-0"
          }`}
        >
          <IconX className="size-4" />
        </Button>
      </div>
    </aside>
  );
};
