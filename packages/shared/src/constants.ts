/**
 * Cross-package business constants.
 *
 * These values are intentionally shared between the API, the extension and the
 * web app so a single change stays consistent everywhere (limits, validation
 * bounds, payload allow/deny lists, ...).
 */

/** Presence slug constraints. */
export const SLUG_MAX_LENGTH = 80;
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** Presence library URL aliases (`metadata.aliases`), each at most `SLUG_MAX_LENGTH` characters. */
export const PRESENCE_ALIAS_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
export const PRESENCE_ALIASES_MAX = 10;

/** Generic text field cap used when sanitizing free-text input. */
export const DEFAULT_TEXT_MAX_LENGTH = 120;

/** Public presence-issue reports from the library page. */
export const PRESENCE_REPORT_MAX_LENGTH = 750;