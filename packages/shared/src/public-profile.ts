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

const HANDLE_MAX_LENGTH = 30;
const HANDLE_MIN_LENGTH = 3;
const HANDLE_SUFFIX_RESERVE = 5;
const HANDLE_FALLBACK = "user";

export const deriveHandleBase = (source: string | null | undefined): string => {
  const cleaned = (source ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^[^a-z0-9]+/, "")
    .slice(0, HANDLE_MAX_LENGTH - HANDLE_SUFFIX_RESERVE);
  const base = cleaned.length >= HANDLE_MIN_LENGTH ? cleaned : `${cleaned}${HANDLE_FALLBACK}`.slice(0, HANDLE_MAX_LENGTH - HANDLE_SUFFIX_RESERVE);
  return RESERVED_PUBLIC_HANDLES.includes(base) ? `${base}_` : base;
};

export const handleCandidate = (base: string, attempt: number): string => (attempt === 0 ? base : `${base}${attempt + 1}`);