import { Button } from "@/components/ui/button";
import { PresenceLayoutToggle } from "@/features/presences/presence-layout-toggle";
import {
  IconBrandDiscord,
  IconDeviceDesktopDown,
  IconDots,
  IconExternalLink,
  IconHeart,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconRotateClockwise2,
  IconWorld,
} from "@/lib/tabler-icons";
import { BRAND_LOCKUP } from "@/shared/brand";
import { DISCORD_INVITE_URL, HOST_DOWNLOAD_URL, REDEEM_PAGE_URL, WEB_BASE_URL } from "@/shared/constants";
import { t } from "@/shared/i18n";
import type { PresenceDisplayMode } from "@/shared/types";
import type { FC, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  displayMode?: PresenceDisplayMode;
  isCheckingUpdates?: boolean;
  onCheckUpdates?: () => void;
  onDisplayModeChange?: (mode: PresenceDisplayMode) => void;
  onReplayOnboarding?: () => void;
  onTogglePause?: () => void;
  presencePaused?: boolean;
  supporter?: boolean;
};

type MenuItem = {
  external?: boolean;
  icon: typeof IconWorld;
  id: string;
  label: Parameters<typeof t>[0];
  onSelect: () => void;
};

const openUrl = (url: string): void => {
  void chrome.tabs.create({ url });
};

export const Header: FC<Props> = ({
  displayMode,
  isCheckingUpdates = false,
  onCheckUpdates,
  onDisplayModeChange,
  onReplayOnboarding,
  onTogglePause,
  presencePaused = false,
  supporter = false,
}): ReactElement => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent): void => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const closeAnd = (action: () => void): void => {
    setMenuOpen(false);
    action();
  };

  const items: MenuItem[] = [
    { id: "website", icon: IconWorld, label: "menu-website", external: true, onSelect: () => openUrl(WEB_BASE_URL) },
    { id: "host", icon: IconDeviceDesktopDown, label: "menu-host", external: true, onSelect: () => openUrl(HOST_DOWNLOAD_URL) },
    { id: "discord", icon: IconBrandDiscord, label: "menu-discord", external: true, onSelect: () => openUrl(DISCORD_INVITE_URL) },
  ];

  if (onCheckUpdates) {
    items.push({ id: "updates", icon: IconRefresh, label: "check-updates", onSelect: onCheckUpdates });
  }
  if (onReplayOnboarding) {
    items.push({ id: "onboarding", icon: IconRotateClockwise2, label: "menu-onboarding", onSelect: () => void onReplayOnboarding() });
  }
  if (!supporter) {
    items.push({
      id: "support",
      icon: IconHeart,
      label: "menu-support",
      external: true,
      onSelect: () => openUrl(REDEEM_PAGE_URL),
    });
  }

  return (
    <header className={`flex items-center justify-between gap-3 ${menuOpen ? "relative z-20" : ""}`}>
      <img
        src={BRAND_LOCKUP}
        alt={chrome.i18n.getMessage("extensionName") || "Nowly"}
        className="ml-2 h-[53px] w-auto min-w-0"
      />
      <div className="mr-2 flex shrink-0 items-center gap-1.5">
        {displayMode && onDisplayModeChange ? (
          <PresenceLayoutToggle value={displayMode} onChange={onDisplayModeChange} />
        ) : null}
        {onTogglePause ? (
          <Button
            variant="unstyled"
            size="none"
            aria-pressed={presencePaused}
            aria-label={presencePaused ? t("presence-pause-resume") : t("presence-pause")}
            onClick={onTogglePause}
            className={`flex size-8 items-center justify-center rounded-xl border border-border transition-colors ${
              presencePaused
                ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
                : "bg-card-2 text-foreground hover:bg-card-hover"
            }`}
          >
            {presencePaused ? <IconPlayerPlay className="size-4" /> : <IconPlayerPause className="size-4" />}
          </Button>
        ) : null}
        <div ref={menuRef} className="relative">
          <Button
            variant="unstyled"
            size="none"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={t("more")}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-8 items-center justify-center rounded-xl border border-border bg-card-2 text-foreground transition-colors hover:bg-card-hover"
          >
            <IconDots className="size-4" />
          </Button>
          {menuOpen ? (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute top-full right-0 z-20 h-80 w-80 translate-x-[18%] -translate-y-[12%] rounded-full bg-background/40 backdrop-blur-2xl [mask-image:radial-gradient(circle,black_0%,black_38%,transparent_72%)] [-webkit-mask-image:radial-gradient(circle,black_0%,black_38%,transparent_72%)]"
              />
              <div
                role="menu"
                className="absolute top-full right-0 z-30 mt-1 min-w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
              >
              {items.map((item) => {
                const Icon = item.icon;
                const spinning = item.id === "updates" && isCheckingUpdates;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={spinning}
                    onClick={() => closeAnd(item.onSelect)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-card-2 disabled:opacity-60"
                  >
                    <Icon className={`size-4 shrink-0 text-muted-foreground ${spinning ? "animate-spin" : ""}`} />
                    <span className="min-w-0 flex-1">{t(item.label)}</span>
                    {item.external ? <IconExternalLink className="size-3.5 shrink-0 text-muted-foreground" /> : null}
                  </button>
                );
              })}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};
