import { CUSTOM_ACTIVITY_EDITOR_PORT } from "@/shared/custom-activity-editor";
import { withCustomActivityWrite } from "@/background/services/custom-activity-write";

const EDITORS_KEY = "customActivityEditors";

type Editors = Record<string, string>;

const readEditors = async (): Promise<Editors> => {
  const stored = await chrome.storage.session.get(EDITORS_KEY);
  return (stored[EDITORS_KEY] ?? {}) as Editors;
};

const updateEditors = (update: (editors: Editors) => void): Promise<void> => {
  return withCustomActivityWrite(async () => {
    const editors = await readEditors();
    update(editors);
    await chrome.storage.session.set({ [EDITORS_KEY]: editors });
  });
};

export const assertCustomActivityEditorClosed = async (id: string): Promise<void> => {
  if (Object.values(await readEditors()).includes(id)) throw new Error("EDITOR_OPEN");
};

export const registerCustomActivityEditors = (): void => {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== CUSTOM_ACTIVITY_EDITOR_PORT || !port.sender?.url?.startsWith(chrome.runtime.getURL(""))) return;

    let key: string | null = null;
    port.onMessage.addListener((message: unknown) => {
      if (!message || typeof message !== "object" || !("id" in message) || typeof message.id !== "string") return;
      if (!("editorId" in message) || typeof message.editorId !== "string" || !/^[a-f0-9-]{36}$/.test(message.editorId)) return;

      const id = message.id;
      const editorKey = message.editorId;
      key = editorKey;
      void updateEditors((editors) => {
        editors[editorKey] = id;
      })
        .then(() => port.postMessage({ ready: true }))
        .catch(() => undefined);
    });
    port.onDisconnect.addListener(() => {
      const editorKey = key;

      if (!editorKey) return;

      void updateEditors((editors) => {
        delete editors[editorKey];
      });
    });
  });
};