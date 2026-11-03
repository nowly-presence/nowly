export const PUBLIC_HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;

export const PUBLIC_BIO_MAX_LENGTH = 280;

export const RESERVED_PUBLIC_HANDLES: readonly string[] = [
  "admin",
  "administrator",
  "api",
  "account",
  "nowly",
  "moderator",
  "mod",
  "staff",
  "support",
  "system",
  "root",
  "help",
  "me",
  "null",
  "undefined"
];

export const isValidPublicHandle = (value: string): boolean => PUBLIC_HANDLE_PATTERN.test(value) && !RESERVED_PUBLIC_HANDLES.includes(value);