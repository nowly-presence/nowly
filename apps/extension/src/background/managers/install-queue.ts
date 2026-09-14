export const INSTALL_QUEUE_KEY = "presenceInstallQueue";
export const INSTALL_QUEUE_ALARM = "install-queue";

export type InstallQueueItem = {
  queuedAt: number;
  slug: string;
};

export const getInstallQueue = async (): Promise<InstallQueueItem[]> => {
  const result = await chrome.storage.local.get(INSTALL_QUEUE_KEY);
  const value = result[INSTALL_QUEUE_KEY];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is InstallQueueItem => (
    Boolean(item)
    && typeof item === "object"
    && typeof (item as InstallQueueItem).slug === "string"
    && typeof (item as InstallQueueItem).queuedAt === "number"
  ));
};

export const setInstallQueue = async (items: InstallQueueItem[]): Promise<void> => {
  await chrome.storage.local.set({ [INSTALL_QUEUE_KEY]: items });
};

export const syncInstallQueueAlarm = async (items: InstallQueueItem[]): Promise<void> => {
  if (items.length === 0) {
    await chrome.alarms.clear(INSTALL_QUEUE_ALARM);
    return;
  }
  await chrome.alarms.create(INSTALL_QUEUE_ALARM, { periodInMinutes: 1 });
};

export const isRetriableInstallFailure = (status?: number): boolean => {
  if (status === undefined) return true;
  if (status === 408 || status === 429) return true;
  return status >= 500;
};

export const enqueueInstall = async (slug: string): Promise<InstallQueueItem[]> => {
  const current = await getInstallQueue();
  const next = [
    { slug, queuedAt: Date.now() },
    ...current.filter((item) => item.slug !== slug),
  ];
  await setInstallQueue(next);
  await syncInstallQueueAlarm(next);
  return next;
};
