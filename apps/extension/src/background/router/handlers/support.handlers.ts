import type { Handler } from "@/background/router/router"
import { recordUsageDay, snoozeSupportPrompt } from "@/background/storage/support.store"

export const handleRecordUsageDay: Handler<"RECORD_USAGE_DAY"> = async () => {
  await recordUsageDay()
  return { ok: true }
}

export const handleSnoozeSupportPrompt: Handler<"SNOOZE_SUPPORT_PROMPT"> = ({ action }) => snoozeSupportPrompt(action)
