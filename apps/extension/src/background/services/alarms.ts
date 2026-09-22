import { INSTALL_QUEUE_ALARM } from "@/background/managers/install-queue"
import { drainInstallQueue } from "@/background/managers/presence-manager"
import { sendActiveHeartbeat } from "@/background/services/active-heartbeat"
import { getActiveSlugsSnapshot, hasActiveSlugs } from "@/background/services/background-context"
import { postNative } from "@/background/services/native"

const ensureAlarm = async (name: string, periodInMinutes: number): Promise<void> => {
  const existing = await chrome.alarms.get(name)
  if (!existing) await chrome.alarms.create(name, { periodInMinutes })
}

export const registerAlarmHandlers = (): void => {
  void ensureAlarm("native-heartbeat", 5)
  void ensureAlarm("api-heartbeat", 5)

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "native-heartbeat") postNative({ type: "PING" })
    if (alarm.name === "api-heartbeat") {
      void (async () => {
        if (!(await hasActiveSlugs())) return
        await sendActiveHeartbeat(await getActiveSlugsSnapshot())
      })()
    }
    if (alarm.name === INSTALL_QUEUE_ALARM) void drainInstallQueue()
  })
}
