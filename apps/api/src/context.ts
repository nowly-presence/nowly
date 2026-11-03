import type { AccountContext } from "@/features/account/extension-token.middleware";

export type AppVariables = {
  account: AccountContext;
};

export type AppEnv = {
  Variables: AppVariables;
};