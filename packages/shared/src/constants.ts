export const SLUG_MAX_LENGTH = 80;
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** Presence library URL aliases (`metadata.aliases`), each at most `SLUG_MAX_LENGTH` characters. */
export const PRESENCE_ALIAS_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
export const PRESENCE_ALIASES_MAX = 10;

export const DEFAULT_TEXT_MAX_LENGTH = 120;

/** Public presence-issue reports from the library page. */
export const PRESENCE_REPORT_MAX_LENGTH = 750;