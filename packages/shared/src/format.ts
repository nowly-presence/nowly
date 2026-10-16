import { DEFAULT_TEXT_MAX_LENGTH } from "./constants";

/**
 * Human-readable byte size (e.g. "1.5 MB", "820.0 KB").
 * Shared by the API (release metadata) and any UI that displays bundle sizes.
 */
export const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

/**
 * Trim a free-text value and cap its length. Returns `undefined` for non-string
 * or empty input so callers can drop the field entirely.
 */
export const cleanText = (
  value: unknown,
  max = DEFAULT_TEXT_MAX_LENGTH,
): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
};