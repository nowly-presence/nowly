import { CUSTOM_ACTIVITY_EDITOR_PORT } from "@/shared/custom-activity-editor";

const RECONNECT_DELAY_MS = 1000;

export const connectCustomActivityEditor = (id: string, onReady: (ready: boolean) => void): (() => void) => {
  const editorId = crypto.randomUUID();
  let disposed = false;
  let reconnect: ReturnType<typeof setTimeout>;
  let port: chrome.runtime.Port;
  const connect = () => {
    port = chrome.runtime.connect({ name: CUSTOM_ACTIVITY_EDITOR_PORT });
    port.onMessage.addListener(() => onReady(true));
    port.onDisconnect.addListener(() => {
      if (disposed) return;

      onReady(false);
      reconnect = setTimeout(connect, RECONNECT_DELAY_MS);
    });
    port.postMessage({ id, editorId });
  };
  connect();
  return () => {
    disposed = true;
    clearTimeout(reconnect);
    port.disconnect();
  };
};