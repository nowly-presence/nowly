import type { MessageKey } from "@/hooks/i18n-provider";
import type { AdminError } from "@/shared/admin/admin-types";

const ERROR_KEYS: Record<AdminError, MessageKey> = {
  UNAUTHORIZED: "admin.error.unauthorized",
  FORBIDDEN: "admin.error.forbidden",
  NOT_FOUND: "admin.error.notFound",
  CONFLICT: "admin.error.conflict",
  INVALID: "admin.error.invalid",
  UNAVAILABLE: "admin.error.unavailable",
  NETWORK: "admin.error.network"
};

export const adminErrorKey = (error: AdminError): MessageKey => ERROR_KEYS[error];