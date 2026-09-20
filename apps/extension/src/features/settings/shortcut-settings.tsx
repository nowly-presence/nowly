import { RiExternalLinkLine } from "@remixicon/react"
import { useCallback, useEffect, useState } from "react"
import { SettingRow } from "@/features/settings/setting-row"
import { t } from "@/shared/i18n"
import { Button } from "@/ui/button"

type CommandRow = {
  name: string
  shortcut: string
}

const commandLabel = (name: string): string => {
  if (name === "open-side-panel" || name === "_execute_action" || name === "_execute_sidebar_action") return t("shortcuts-open-panel")
  if (name === "toggle-presence-pause") return t("shortcuts-pause")
  return name
}

const shortcutPageUrl = (): string => (/Edg\//.test(navigator.userAgent) ? "edge://extensions/shortcuts" : "chrome://extensions/shortcuts")

const openShortcutSettings = (): void => {
  const commands = chrome.commands as typeof chrome.commands & { openShortcutSettings?: () => Promise<void> }
  if (typeof commands.openShortcutSettings === "function") {
    void commands.openShortcutSettings()
    return
  }
  void chrome.tabs.create({ url: shortcutPageUrl() })
}

export const ShortcutSettings = (): React.JSX.Element => {
  const [commands, setCommands] = useState<CommandRow[]>([])

  const refresh = useCallback((): void => {
    chrome.commands.getAll((items) => {
      setCommands(items.filter((item) => Boolean(item.name)).map((item) => ({ name: item.name ?? "", shortcut: item.shortcut ?? "" })))
    })
  }, [])

  useEffect(() => {
    refresh()
    const onVisible = (): void => {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", refresh)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", refresh)
    }
  }, [refresh])

  const missing = commands.some((item) => item.shortcut.length === 0)

  return (
    <SettingRow
      title={t("shortcuts")}
      description={t("shortcuts-description")}
    >
      {missing ? <p className="text-xs leading-4 text-warning">{t("shortcuts-unassigned-hint")}</p> : null}
      <ul className="flex flex-col gap-2">
        {commands.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-3"
          >
            <span className="min-w-0 text-sm text-foreground">{commandLabel(item.name)}</span>
            <span className="shrink-0 rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {item.shortcut || t("shortcuts-unassigned")}
            </span>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        size="sm"
        onClick={openShortcutSettings}
        className="w-full"
      >
        {t("shortcuts-change")}
        <RiExternalLinkLine className="size-3.5" />
      </Button>
    </SettingRow>
  )
}
