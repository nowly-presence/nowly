import { createSerialQueue } from "@/background/storage/serial-queue";

export const INSTALL_QUEUE_KEY = "presenceInstallQueue";
export const INSTALL_QUEUE_ALARM = "install-queue";

export type InstallQueueItem = {
  queuedAt: number;
  slug: string;
  source?: "web" | "extension" | "restore" | "system";
};

export const getInstallQueue = async (): Promise<InstallQueueItem[]> => {
  const result = await chrome.storage.local.get(INSTALL_QUEUE_KEY);

  const value = result[INSTALL_QUEUE_KEY];

  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is InstallQueueItem =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as InstallQueueItem).slug === "string" &&
        typeof (item as InstallQueueItem).queuedAt === "number"
    )
    .map((item) => ({
      ...item,
      source: item.source === "web" || item.source === "extension" || item.source === "restore" ? item.source : "system"
    }));
};

const syncInstallQueueAlarm = async (items: InstallQueueItem[]): Promise<void> => {
  if (items.length === 0) {
    await chrome.alarms.clear(INSTALL_QUEUE_ALARM);
    return;
  }

  if (!(await chrome.alarms.get(INSTALL_QUEUE_ALARM))) {
    await chrome.alarms.create(INSTALL_QUEUE_ALARM, { periodInMinutes: 1 });
  }
};

const serializeInstallQueue = createSerialQueue();

const mutateInstallQueue = (update: (current: InstallQueueItem[]) => InstallQueueItem[]): Promise<InstallQueueItem[]> =>
  serializeInstallQueue(async () => {
    const current = await getInstallQueue();

    const next = update(current);
    if (next !== current) await chrome.storage.local.set({ [INSTALL_QUEUE_KEY]: next });
    await syncInstallQueueAlarm(next);
    return next;
  });

export const isRetriableInstallFailure = (status?: number): boolean => {
  if (status === undefined) return true;
  if (status === 408 || status === 429) return true;

  return status >= 500;
};

export const enqueueInstall = async (slug: string, source: InstallQueueItem["source"] = "system"): Promise<void> => {
  await mutateInstallQueue((current) => {
    const previous = current.find((item) => item.slug === slug);
    const queuedAt = previous ? Math.max(Date.now(), previous.queuedAt + 1) : Date.now();
    return [
      { slug, source, queuedAt },
      ...current.filter((item) => item.slug !== slug)
    ];
  });
};

export const removeQueuedInstall = async (slug: string): Promise<void> => {
  await mutateInstallQueue((current) => (current.some((item) => item.slug === slug) ? current.filter((item) => item.slug !== slug) : current));
};

type InstallAttempt = (item: InstallQueueItem) => Promise<{
  ok: boolean;
  status?: number;
}>;

let draining: Promise<InstallQueueItem[]> | null = null;

export const drainQueuedInstalls = (install: InstallAttempt): Promise<InstallQueueItem[]> => {
  draining ??= (async () => {
    try {
      const pending = await getInstallQueue();

      const completed = new Map<string, number>();

      for (const item of pending) {
        const result = await install(item);
        if (result.ok || !isRetriableInstallFailure(result.status)) completed.set(item.slug, item.queuedAt);
      }

      return await mutateInstallQueue((current) => (completed.size ? current.filter((item) => completed.get(item.slug) !== item.queuedAt) : current));
    } finally {
      draining = null;
    }
  })();

  return draining;
};