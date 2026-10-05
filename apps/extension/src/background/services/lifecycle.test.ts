import { describe, expect, it } from "vitest"
import { hasHeartbeatLogChanged } from "@/background/services/lifecycle"

describe("hasHeartbeatLogChanged", () => {
  const connected = { connected: true, status: "discord connected", version: "1.4.4" }

  it("only reports the first heartbeat and state transitions", () => {
    expect(hasHeartbeatLogChanged(undefined, connected)).toBe(true)
    expect(hasHeartbeatLogChanged(connected, connected)).toBe(false)
    expect(hasHeartbeatLogChanged(connected, { ...connected, status: "discord disconnected" })).toBe(true)
    expect(hasHeartbeatLogChanged(connected, { ...connected, version: "1.4.5" })).toBe(true)
    expect(hasHeartbeatLogChanged(connected, { ...connected, code: "DISCORD_IPC_ACCESS_DENIED" })).toBe(true)
    expect(hasHeartbeatLogChanged(connected, { connected: false, status: "discord disconnected" })).toBe(true)
  })
})
