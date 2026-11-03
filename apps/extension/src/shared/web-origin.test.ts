import { describe, expect, it } from "vitest";
import { isAllowedAccountOrigin, isAllowedWebMessage, isAllowedWebSender } from "./web-origin";

const SITE = "https://nowly.me";
const ACCOUNT = "https://account.nowly.me";

describe("web origins", () => {
  it("accepts the site for every message", () => {
    expect(isAllowedWebMessage(SITE, "INSTALL_PRESENCE")).toBe(true);
    expect(isAllowedWebMessage(SITE, "NOWLY_SESSION")).toBe(true);
  });

  it("lets the account space exchange the session and nothing else", () => {
    expect(isAllowedAccountOrigin(ACCOUNT)).toBe(true);
    expect(isAllowedWebMessage(ACCOUNT, "NOWLY_SESSION")).toBe(true);

    for (const type of ["INSTALL_PRESENCE", "UNINSTALL_PRESENCE", "GET_DEVICE_INFO", "APPLY_ACTIVITY_PUBLICATION"])
      expect(isAllowedWebMessage(ACCOUNT, type)).toBe(false);
  });

  it("refuses look-alike and local origins in store builds", () => {
    for (const origin of ["https://account.nowly.me.evil.test", "http://account.nowly.me", "https://evil.nowly.me", "http://localhost:3003"])
      expect(isAllowedAccountOrigin(origin)).toBe(false);
  });

  it("checks the sender url of a background message", () => {
    expect(isAllowedWebSender(`${ACCOUNT}/connect?permission=admin`, SITE, "NOWLY_SESSION")).toBe(true);
    expect(isAllowedWebSender(`${ACCOUNT}/connect`, SITE, "INSTALL_PRESENCE")).toBe(false);
    expect(isAllowedWebSender(`${SITE}/library`, SITE, "INSTALL_PRESENCE")).toBe(true);
    expect(isAllowedWebSender(undefined, SITE, "NOWLY_SESSION")).toBe(false);
    expect(isAllowedWebSender("not a url", SITE, "NOWLY_SESSION")).toBe(false);
  });
});