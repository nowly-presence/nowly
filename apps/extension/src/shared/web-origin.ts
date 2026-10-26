import { IS_CANARY } from "@/shared/brand";
import { WEB_BASE_URL } from "@/shared/constants";

export const isAllowedWebOrigin = (origin: string, configured = WEB_BASE_URL): boolean =>
  origin === new URL(configured).origin || (IS_CANARY && (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000"));

export const isAllowedWebSender = (url: string | undefined, configured: string): boolean => {
  try {
    return Boolean(url && isAllowedWebOrigin(new URL(url).origin, configured));
  } catch {
    return false;
  }
};