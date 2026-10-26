import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assertCustomActivityEditorClosed, registerCustomActivityEditors } from "@/background/services/custom-activity-editors";
import { withCustomActivityWrite } from "@/background/services/custom-activity-write";
import { connectCustomActivityEditor } from "@/lib/custom-activity-editor-messages";
import { CUSTOM_ACTIVITY_EDITOR_PORT } from "@/shared/custom-activity-editor";
import { installChromeMock } from "@/test/chrome-mock";

type Listener<T> = (value: T) => void;

const event = <T>() => {
  const listeners = new Set<Listener<T>>();
  return {
    addListener: (listener: Listener<T>) => {
      listeners.add(listener);
    },
    emit: (value: T) => {
      listeners.forEach((listener) => listener(value));
    }
  };
};

const EXTENSION_URL = "chrome-extension://fixture/";
const LOCAL_ID = "local-activity";
const EDITOR_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const flushWrites = async () => {
  await withCustomActivityWrite(async () => undefined);
  await Promise.resolve();
};

const portPair = (name = CUSTOM_ACTIVITY_EDITOR_PORT, url = `${EXTENSION_URL}sidepanel/index.html`) => {
  const backgroundMessages = event<unknown>();
  const pageMessages = event<unknown>();
  const disconnects = event<void>();
  const background = {
    name,
    sender: { url },
    onMessage: backgroundMessages,
    onDisconnect: disconnects,
    postMessage: vi.fn((value: unknown) => pageMessages.emit(value))
  };
  const page = {
    onMessage: pageMessages,
    onDisconnect: disconnects,
    postMessage: vi.fn((value: unknown) => backgroundMessages.emit(value)),
    disconnect: vi.fn(() => disconnects.emit())
  };
  return { background, page, disconnects };
};

describe("actual editor port lifecycle", () => {
  let connections: ReturnType<typeof event<ReturnType<typeof portPair>["background"]>>;
  beforeEach(() => {
    installChromeMock();
    connections = event();
    Object.assign(chrome.runtime, {
      getURL: () => EXTENSION_URL,
      onConnect: connections
    });
    registerCustomActivityEditors();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it("registers before readiness, blocks replacement and releases on disconnect", async () => {
    const pair = portPair();
    connections.emit(pair.background);
    pair.page.postMessage({
      id: LOCAL_ID,
      editorId: EDITOR_ID
    });
    expect(pair.background.postMessage).not.toHaveBeenCalled();
    await flushWrites();
    expect(pair.background.postMessage).toHaveBeenCalledWith({ ready: true });
    await expect(assertCustomActivityEditorClosed(LOCAL_ID)).rejects.toThrow("EDITOR_OPEN");
    pair.page.disconnect();
    await flushWrites();
    await expect(assertCustomActivityEditorClosed(LOCAL_ID)).resolves.toBeUndefined();
  });
  it("ignores foreign senders, incorrect ports and malformed registrations", async () => {
    for (const pair of [
      portPair(CUSTOM_ACTIVITY_EDITOR_PORT, "https://nowly.me"),
      portPair("other-port")
    ]) {
      connections.emit(pair.background);
      pair.page.postMessage({
        id: LOCAL_ID,
        editorId: EDITOR_ID
      });
      expect(pair.background.postMessage).not.toHaveBeenCalled();
    }

    const pair = portPair();
    connections.emit(pair.background);

    for (const payload of [
      null,
      { id: LOCAL_ID },
      {
        id: LOCAL_ID,
        editorId: "invalid"
      }
    ])
      pair.page.postMessage(payload);

    await flushWrites();
    await expect(assertCustomActivityEditorClosed(LOCAL_ID)).resolves.toBeUndefined();
  });
  it("reconnects the transport with the same editor identity and cleans up after closing", async () => {
    vi.useFakeTimers();
    const pairs: ReturnType<typeof portPair>[] = [];
    Object.assign(chrome.runtime, {
      connect: () => {
        const pair = portPair();
        pairs.push(pair);
        connections.emit(pair.background);
        return pair.page;
      }
    });
    const ready = vi.fn();
    const close = connectCustomActivityEditor(LOCAL_ID, ready);
    await flushWrites();
    expect(ready).toHaveBeenLastCalledWith(true);
    const registration = pairs[0].page.postMessage.mock.calls[0][0];
    pairs[0].disconnects.emit();
    expect(ready).toHaveBeenLastCalledWith(false);
    await flushWrites();
    await vi.advanceTimersByTimeAsync(1000);
    await flushWrites();
    expect(pairs).toHaveLength(2);
    expect(pairs[1].page.postMessage).toHaveBeenCalledWith(registration);
    expect(ready).toHaveBeenLastCalledWith(true);
    await expect(assertCustomActivityEditorClosed(LOCAL_ID)).rejects.toThrow("EDITOR_OPEN");
    close();
    await flushWrites();
    await expect(assertCustomActivityEditorClosed(LOCAL_ID)).resolves.toBeUndefined();
    await vi.advanceTimersByTimeAsync(2000);
    expect(pairs).toHaveLength(2);
  });
  it("keeps protection until every editor for the activity has closed", async () => {
    const first = portPair();
    const second = portPair();
    connections.emit(first.background);
    connections.emit(second.background);
    first.page.postMessage({
      id: LOCAL_ID,
      editorId: EDITOR_ID
    });
    second.page.postMessage({
      id: LOCAL_ID,
      editorId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    });
    await flushWrites();
    first.page.disconnect();
    await flushWrites();
    await expect(assertCustomActivityEditorClosed(LOCAL_ID)).rejects.toThrow("EDITOR_OPEN");
    second.page.disconnect();
    await flushWrites();
    await expect(assertCustomActivityEditorClosed(LOCAL_ID)).resolves.toBeUndefined();
  });
});