import { DEFAULT_TEXT_MAX_LENGTH } from "./constants";

/**
 * Shared by the API (release metadata) and any UI that displays bundle sizes.
 */
export const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  return `${(bytes / 1024).toFixed(1)} KB`;
};

/**
 * Callers can omit the field when there is no usable input.
 */
export const cleanText = (value: unknown, max = DEFAULT_TEXT_MAX_LENGTH): string | undefined => {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  if (!trimmed) return undefined;

  return trimmed.slice(0, max);
};