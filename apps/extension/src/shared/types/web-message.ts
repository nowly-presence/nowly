import type { EXT_WEB_SOURCE, WEB_BRIDGE_PING, WebBridgeRequest } from "@nowly/shared/web-bridge-protocol";

export type WebMessage = {
  source: typeof EXT_WEB_SOURCE;
  type: WebBridgeRequest | typeof WEB_BRIDGE_PING;
  payload?: unknown;
  messageId?: string;
};