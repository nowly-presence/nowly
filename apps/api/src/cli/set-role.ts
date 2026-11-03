import "dotenv/config";
import { findUserId, setUserRole } from "@/features/admin/roles.service";
import { isUserRole, USER_ROLES } from "@nowly/shared/roles";

const [target, role] = process.argv.slice(2);

if (!target || !isUserRole(role)) {
  console.error(`Usage: pnpm --filter @nowly/api role:set <user id or email> <${USER_ROLES.join("|")}>`);
  process.exit(2);
}

const userId = await findUserId(target);

if (!userId) {
  console.error(`No user matches ${target}`);
  process.exit(1);
}

const result = await setUserRole({ kind: "cli" }, userId, role);

console.log(
  result.found && result.changed ? `Role of ${userId} set to ${role} (${result.revokedTokens} admin token(s) revoked)` : `Role of ${userId} is already ${role}`
);
process.exit(0);