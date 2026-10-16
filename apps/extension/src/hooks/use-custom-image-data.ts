import { useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";
import type { CustomImage } from "@/shared/types";

const cache = new Map<string, string>();
const listeners = new Set<() => void>();
const inFlight = new Set<string>();

export const rememberCustomImage = (hash: string, dataUrl: string): void => {
  cache.set(hash, dataUrl);
  listeners.forEach((listener) => listener());
};

const load = (hashes: string[]) => {
  const missing = hashes.filter((hash) => !cache.has(hash) && !inFlight.has(hash));

  if (missing.length === 0) return;

  missing.forEach((hash) => inFlight.add(hash));
  void sendMessage("GET_CUSTOM_IMAGES", { hashes: missing })
    .then((images) => Object.entries(images ?? {}).forEach(([hash, dataUrl]) => cache.set(hash, dataUrl)))
    .catch(() => undefined)
    .finally(() => {
      missing.forEach((hash) => inFlight.delete(hash));
      listeners.forEach((listener) => listener());
    });
};

export const useCustomImageSrc = (image: CustomImage): string | undefined => {
  const [, setVersion] = useState(0);
  const hash = image.kind === "upload" ? image.hash : null;

  useEffect(() => {
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    if (hash) load([hash]);
    return () => {
      listeners.delete(listener);
    };
  }, [hash]);

  if (image.kind === "url") return image.url.trim().startsWith("https://") ? image.url.trim() : undefined;
  if (image.kind === "upload") return cache.get(image.hash) ?? image.remoteUrl;

  return undefined;
};