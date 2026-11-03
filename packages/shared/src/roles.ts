export const USER_ROLES = ["user", "moderator", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ADMIN_CAPABILITIES = ["review", "publish", "announce", "manage"] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

export const ROLE_CAPABILITIES: Readonly<Record<UserRole, readonly AdminCapability[]>> = {
  user: [],
  moderator: ["review"],
  admin: ADMIN_CAPABILITIES
};

export const isUserRole = (value: unknown): value is UserRole => typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);

export const capabilitiesOf = (role: unknown): AdminCapability[] => (isUserRole(role) ? [...ROLE_CAPABILITIES[role]] : []);

export const hasCapability = (role: unknown, capability: AdminCapability): boolean => capabilitiesOf(role).includes(capability);

export const isStaffRole = (role: unknown): boolean => capabilitiesOf(role).length > 0;