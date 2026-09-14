import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import { IconExternalLink } from "@/lib/tabler-icons";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

type CommandRow = {
  name: string;
  shortcut: string;
};

const commandLabel = (name: string): string => {
  if (name === "open-side-panel" || name === "_execute_action" || name === "_execute_sidebar_action") {
    return t("shortcuts-open-panel");
  }
  if (name === "toggle-presence-pause") return t("shortcuts-pause");
  return name;
};

const shortcutPageUrl = (): string => {
  if (/Edg\//.test(navigator.userAgent)) return "edge://extensions/shortcuts";
  return "chrome://extensions/shortcuts";
};

const openShortcutSettings = (): void => {
  const commands = chrome.commands as typeof chrome.commands & {
    openShortcutSettings?: () => Promise<void>;
  };
  if (typeof commands.openShortcutSettings === "function") {
    void commands.openShortcutSettings();
    return;
  }
  void chrome.tabs.create({ url: shortcutPageUrl() });
};

export const ShortcutSettings: FC = (): ReactElement => {
  const [commands, setCommands] = useState<CommandRow[]>([]);

  const refresh = useCallback((): void => {
    chrome.commands.getAll((items) => {
      setCommands(
        items
          .filter((item) => Boolean(item.name))
          .map((item) => ({ name: item.name ?? "", shortcut: item.shortcut ?? "" })),
      );
    });
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = (): void => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const missing = commands.some((item) => item.shortcut.length === 0);

  return (
    <>
      <h2 className="mb-2 text-xs font-semibold text-muted-foreground">{t("shortcuts")}</h2>
      <p className="text-xs leading-5 text-muted-foreground">{t("shortcuts-description")}</p>
      {missing ? (
        <p className="mt-2 text-xs leading-5 text-amber-400">{t("shortcuts-unassigned-hint")}</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {commands.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3">
            <span className="min-w-0 text-sm text-foreground">{commandLabel(item.name)}</span>
            <span className="shrink-0 rounded-md border border-border bg-card-2 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {item.shortcut || t("shortcuts-unassigned")}
            </span>
          </li>
        ))}
      </ul>
      <Button
        variant="unstyled"
        size="none"
        onClick={openShortcutSettings}
        className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
      >
        {t("shortcuts-change")}
        <IconExternalLink className="size-3.5" />
      </Button>
    </>
  );
};
