import { isWebBridgeRequest, WEB_BRIDGE_REQUESTS, type WebBridgeRequest } from "@nowly/shared/web-bridge-protocol";

export type RoutedWebRequest = Exclude<WebBridgeRequest, "GET_DEVICE_INFO">;

export const ROUTED_WEB_REQUESTS: readonly RoutedWebRequest[] = Object.keys(WEB_BRIDGE_REQUESTS)
  .filter(isWebBridgeRequest)
  .filter((type): type is RoutedWebRequest => type !== "GET_DEVICE_INFO");

export const isRoutedWebRequest = (type: WebBridgeRequest): type is RoutedWebRequest => (ROUTED_WEB_REQUESTS as readonly string[]).includes(type);

export const toRouterMessageType = (type: RoutedWebRequest) => (type === "GET_INSTALLED" ? "GET_PRESENCES" : type);

const webRouterMessageTypes = new Set<string>(ROUTED_WEB_REQUESTS.map(toRouterMessageType));

export const isWebRouterMessageType = (type: string): boolean => webRouterMessageTypes.has(type);