export type ClassValue = string | number | false | null | undefined;

/** Tiny className joiner (clsx-lite): filters out falsy values and joins with spaces. */
export const cn = (...values: ClassValue[]): string => values.filter(Boolean).join(" ");
