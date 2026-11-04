import type { AdminCapability } from "@nowly/shared";

export type StaffNavItem = {
  href: "/moderation" | "/moderation/review" | "/moderation/presences" | "/moderation/users" | "/moderation/announcements" | "/moderation/audit";
  key: "overview" | "review" | "presences" | "users" | "announcements" | "audit";
  capability: AdminCapability;
};

export const STAFF_NAV: readonly StaffNavItem[] = [
  { href: "/moderation", key: "overview", capability: "review" },
  { href: "/moderation/review", key: "review", capability: "review" },
  { href: "/moderation/presences", key: "presences", capability: "publish" },
  { href: "/moderation/users", key: "users", capability: "manage" },
  { href: "/moderation/announcements", key: "announcements", capability: "announce" },
  { href: "/moderation/audit", key: "audit", capability: "manage" }
];

export const visibleStaffNav = (capabilities: readonly string[]): StaffNavItem[] => STAFF_NAV.filter((item) => capabilities.includes(item.capability));

export const hasStaffAccess = (capabilities: readonly string[]): boolean => visibleStaffNav(capabilities).length > 0;

export const isActiveStaffItem = (pathname: string, href: string): boolean => (href === "/moderation" ? pathname === href : pathname.startsWith(href));

export const staffSubmissionHref = (id: string): string => `/moderation/review/${encodeURIComponent(id)}`;
