import { REPORTER_KEY_BYTES } from "@/shared/reports";

const REPORTER_KEY_STORAGE = "reporterKey";
const HEX_RADIX = 16;
const HEX_WIDTH = 2;

const generateKey = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(REPORTER_KEY_BYTES)), (byte) => byte.toString(HEX_RADIX).padStart(HEX_WIDTH, "0")).join("");

export const getReporterKey = async (): Promise<string> => {
  const stored = (await chrome.storage.local.get(REPORTER_KEY_STORAGE))[REPORTER_KEY_STORAGE];

  if (typeof stored === "string" && stored.length >= REPORTER_KEY_BYTES) return stored;

  const key = generateKey();
  await chrome.storage.local.set({ [REPORTER_KEY_STORAGE]: key });
  return key;
};