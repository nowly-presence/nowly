export const bytesToBase64 = (bytes: Uint8Array): string => {
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

export const base64ToBytes = (value: string): Uint8Array | null => {
  try {
    const binary = atob(value);
    const out = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) out[index] = binary.charCodeAt(index);
    return out;
  } catch {
    return null;
  }
};

export const toZipBytes = (payload: unknown): Uint8Array | null => {
  if (typeof payload === "string") return base64ToBytes(payload.replace(/\s+/g, ""));
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (ArrayBuffer.isView(payload)) {
    const view = payload as ArrayBufferView;
    return new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
  }
  if (Array.isArray(payload) && payload.every((item) => typeof item === "number")) {
    return Uint8Array.from(payload);
  }
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const numericKeys = Object.keys(record).filter((key) => /^\d+$/.test(key));
  if (numericKeys.length === 0) return null;

  const declared = typeof record.length === "number" ? record.length : Math.max(...numericKeys.map(Number)) + 1;
  const out = new Uint8Array(declared);
  for (const key of numericKeys) {
    const index = Number(key);
    if (index >= 0 && index < declared) out[index] = Number(record[key]) & 0xff;
  }
  return out;
};
