import {
  isSupportPromptState,
  localDayKey,
  DEFAULT_SUPPORT_PROMPT,
  SUPPORT_PROMPT_KEY,
  withSnooze,
  withUsageDay,
  type SupportPromptAction,
  type SupportPromptState,
} from "@/shared/support-prompt"

let queue: Promise<unknown> = Promise.resolve()
let recordedDay: string | null = null

const serialize = <T>(task: () => Promise<T>): Promise<T> => {
  const next = queue.then(task, task)
  queue = next.catch(() => undefined)
  return next
}

export const getSupportPrompt = async (): Promise<SupportPromptState> => {
  const result = await chrome.storage.local.get(SUPPORT_PROMPT_KEY)
  const value: unknown = result[SUPPORT_PROMPT_KEY]
  return isSupportPromptState(value) ? value : DEFAULT_SUPPORT_PROMPT
}

const setSupportPrompt = (state: SupportPromptState): Promise<void> => chrome.storage.local.set({ [SUPPORT_PROMPT_KEY]: state })

export const recordUsageDay = (now = Date.now()): Promise<void> => {
  if (recordedDay === localDayKey(now)) return Promise.resolve()
  return serialize(async () => {
    const next = withUsageDay(await getSupportPrompt(), now)
    if (next) await setSupportPrompt(next)
    recordedDay = localDayKey(now)
  })
}

export const snoozeSupportPrompt = (action: SupportPromptAction, now = Date.now()): Promise<SupportPromptState> =>
  serialize(async () => {
    const next = withSnooze(await getSupportPrompt(), action, now)
    await setSupportPrompt(next)
    return next
  })
