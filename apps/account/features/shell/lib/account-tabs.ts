export const ACCOUNT_TABS = [
  {
    href: "/profile",
    key: "tab-profile",
    capability: null
  },
  {
    href: "/devices",
    key: "tab-devices",
    capability: null
  },
  {
    href: "/presences",
    key: "tab-presences",
    capability: null
  },
  {
    href: "/creations",
    key: "tab-creations",
    capability: null
  },
  {
    href: "/public-page",
    key: "tab-public",
    capability: null
  }
] as const;

export const visibleTabs = (capabilities: readonly string[]) => ACCOUNT_TABS.filter((tab) => tab.capability === null || capabilities.includes(tab.capability));

export const MODERATION_TABS = [
  {
    href: "/moderation/review",
    key: "tab-review",
    capability: "review"
  },
  {
    href: "/moderation/users",
    key: "tab-users",
    capability: "manage"
  }
] as const;

export const visibleModerationTabs = (capabilities: readonly string[]) => MODERATION_TABS.filter((tab) => capabilities.includes(tab.capability));
