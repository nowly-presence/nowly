export type DockLayout<T extends string> = T[][];

export type DockDropTarget = {
  kind: "into";
  group: number;
  index: number;
} | {
  kind: "new";
  side: "start" | "end";
};

export const DOCK_MAX_GROUPS = 3;

export const DOCK_TABS = ["activity", "store", "custom", "announcements", "settings"] as const;

export const visibleDockTabs = (hidden: readonly string[] = []) => DOCK_TABS.filter((tab) => tab === "activity" || tab === "settings" || !hidden.includes(tab));

export const normalizeDockLayout = <T extends string>(layout: unknown, tabs: readonly T[]): DockLayout<T> => {
  const seen = new Set<T>();
  const isTab = (value: unknown): value is T => typeof value === "string" && tabs.some((tab) => tab === value);
  const groups = (Array.isArray(layout) ? layout : [])
    .map((group) => (Array.isArray(group) ? group : []).filter((tab): tab is T => isTab(tab) && !seen.has(tab) && Boolean(seen.add(tab))))
    .filter((group) => group.length > 0)
    .slice(0, DOCK_MAX_GROUPS);
  const missing = tabs.filter((tab) => !groups.some((group) => group.includes(tab)));

  if (groups.length === 0) return [[...missing]];

  return missing.length
    ? [
        ...groups.slice(0, -1),
        [...groups[groups.length - 1], ...missing]
      ]
    : groups;
};

export const isDefaultDockLayout = <T extends string>(layout: DockLayout<T>, tabs: readonly T[]): boolean =>
  layout.length === 1 && layout[0].length === tabs.length && layout[0].every((tab, index) => tab === tabs[index]);

export const removeDockTab = <T extends string>(layout: DockLayout<T>, tab: T): DockLayout<T> =>
  layout.map((group) => group.filter((item) => item !== tab)).filter((group) => group.length > 0);

export const insertDockTab = <T extends string>(base: DockLayout<T>, tab: T, target: DockDropTarget): DockLayout<T> => {
  if (base.length === 0) return [[tab]];
  if (target.kind === "new" && base.length < DOCK_MAX_GROUPS) return target.side === "start"
    ? [
        [tab],
        ...base
      ]
    : [
        ...base,
        [tab]
      ];

  const edge = target.kind === "new" ? (target.side === "start" ? 0 : base.length - 1) : Math.max(0, Math.min(target.group, base.length - 1));
  const index = target.kind === "new" ? (target.side === "start" ? 0 : base[edge].length) : target.index;
  return base.map((items, position) => {
    if (position !== edge) return items;

    const copy = [...items];
    copy.splice(Math.max(0, Math.min(index, copy.length)), 0, tab);
    return copy;
  });
};

export const moveDockTab = <T extends string>(layout: DockLayout<T>, tab: T, target: DockDropTarget): DockLayout<T> =>
  layout.some((group) => group.includes(tab)) ? insertDockTab(removeDockTab(layout, tab), tab, target) : layout;