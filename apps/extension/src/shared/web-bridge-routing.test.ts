import { describe, expect, it } from "vitest";
import { isRoutedWebRequest, isWebRouterMessageType, toRouterMessageType } from "@/shared/web-bridge-routing";

describe("web bridge routing", () => {
  it("answers the device info request in the content script instead of routing it", () => {
    expect(isRoutedWebRequest("GET_DEVICE_INFO")).toBe(false);
    expect(isWebRouterMessageType("GET_DEVICE_INFO")).toBe(false);
  });

  it("maps the installed list request to the presence list handler", () => {
    expect(toRouterMessageType("GET_INSTALLED")).toBe("GET_PRESENCES");
    expect(isWebRouterMessageType("GET_PRESENCES")).toBe(true);
    expect(isWebRouterMessageType("GET_INSTALLED")).toBe(false);
  });

  it("never lets a web page reach router types outside the bridge", () => {
    for (const type of [
      "INSTALL_PRESENCE_FROM_API",
      "INSTALL_LOCAL_PRESENCE_ZIP",
      "BULK_UNINSTALL_PRESENCE",
      "SAVE_CUSTOM_ACTIVITY",
      "GET_INSTALL_QUEUE",
      "__proto__",
      "toString"
    ]) {
      expect(isWebRouterMessageType(type)).toBe(false);
    }
  });

  it("routes the bridge requests that have a router handler", () => {
    for (const type of ["INSTALL_PRESENCE", "UPDATE_PRESENCE", "UNINSTALL_PRESENCE", "GET_DIAGNOSTIC"]) {
      expect(isWebRouterMessageType(type)).toBe(true);
    }
  });
});