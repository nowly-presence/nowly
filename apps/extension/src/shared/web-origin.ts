import { IS_CANARY } from "@/shared/brand";
import { ACCOUNT_BASE_URL, WEB_BASE_URL } from "@/shared/constants";

export const ACCOUNT_ORIGIN_MESSAGE_TYPES: readonly string[] = ["NOWLY_SESSION"];

export const isAllowedWebOrigin = (origin: string, configured = WEB_BASE_URL): boolean =>
  origin === new URL(configured).origin || (IS_CANARY && (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000"));

export const isAllowedAccountOrigin = (origin: string, configured = ACCOUNT_BASE_URL): boolean =>
  origin === new URL(configured).origin || (IS_CANARY && (origin === "http://localhost:3003" || origin === "http://127.0.0.1:3003"));

export const isAllowedWebMessage = (origin: string, type: string, configured = WEB_BASE_URL): boolean =>
  isAllowedWebOrigin(origin, configured) || (isAllowedAccountOrigin(origin) && ACCOUNT_ORIGIN_MESSAGE_TYPES.includes(type));

export const isAllowedWebSender = (url: string | undefined, configured: string, type: string): boolean => {
  try {
    return Boolean(url && isAllowedWebMessage(new URL(url).origin, type, configured));
  } catch {
    return false;
  }
};