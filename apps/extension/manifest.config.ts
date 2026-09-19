// Single source of truth for the extension manifest. Browser/channel-specific
// mutations (background shape, side panel vs sidebar action, permissions,
// browser_specific_settings) are applied by scripts/generate-manifest.ts —
// never edit dist/**/manifest.json by hand.

export const DEV_CHROME_EXTENSION_ID = "abbegmindbabanjcabnmcjmamaoffbam"

// Only kept for local unpacked testing (channel=canary) so the chrome-computed
// extension ID stays stable across reloads. Stripped from store builds - the
// Chrome Web Store assigns its own ID on first upload.
const DEV_CHROME_MANIFEST_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu2N7zaQk3HIXHgXyQsWUM5DjTVLue2O3jBxbvpNYsBzGd2liEc+OiinkMz3q33kZe95ApiBE8sTQ6mxP+5n21LUD17Pz1eQFYQrAuASRio/WFuOeqQRn4LNag1Z7iWyxXM0ztmNBadr8ra0x11Um/NjCrnfNPhP27gsTRz+2PO4X9ZRzD2efFrYa4fR28KIgqeYoGY/yIqUQIu8hM939+oKFHpDbPm7TbxMf7AzoS5Rcx+n7RG9eaMbUCHUJuEYlWUTqvIeThUgY0waQkq5BSe33XbvaZyWx3jyid1dok8QxYExt6lqX2jKB8xhgMLICjlbtvXh4tKTFNaWonS9ntQIDAQAB"

const icons = { 16: "icons/icon16.png", 48: "icons/icon48.png", 128: "icons/icon128.png" }

export const manifestConfig = {
  manifest_version: 3 as const,
  name: "__MSG_extensionName__",
  minimum_chrome_version: "120",
  description: "__MSG_extensionDescription__",
  default_locale: "fr",
  permissions: ["nativeMessaging", "storage", "alarms", "userScripts", "sidePanel", "contextMenus"],
  host_permissions: ["<all_urls>"],
  key: DEV_CHROME_MANIFEST_KEY,
  content_scripts: [{ matches: ["<all_urls>"], js: ["content.js"], run_at: "document_idle" as const }],
  icons,
  action: { default_icon: icons },
  commands: {
    "open-side-panel": {
      suggested_key: { default: "Ctrl+Shift+Y", mac: "Command+Shift+Y" },
      description: "__MSG_commandOpenPanel__",
    },
    "toggle-presence-pause": {
      suggested_key: { default: "Ctrl+Shift+U", mac: "Command+Shift+U" },
      description: "__MSG_commandTogglePause__",
    },
  },
}
