import type { AccountContext } from "@/features/account/extension-token.middleware";
import type { StaffContext } from "@/features/admin/admin.middleware";
import type { AuditActor } from "@/features/admin/audit.service";

export type AppVariables = {
  account: AccountContext;
  staff: StaffContext;
  actor: AuditActor;
};

export type AppEnv = {
  Variables: AppVariables;
};