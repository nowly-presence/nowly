const VERSION_PARTS = 3;

const parseVersion = (version: string): number[] | null => {
  const parts = version.split(".").map((part) => Number.parseInt(part, 10));
  return parts.length > 0 && parts.every((part) => Number.isInteger(part) && part >= 0) ? parts : null;
};

export const isVersionAtLeast = (version: string | undefined, minimum: string): boolean => {
  const current = version === undefined ? null : parseVersion(version);
  const required = parseVersion(minimum);

  if (!current || !required) return false;

  for (let index = 0; index < VERSION_PARTS; index += 1) {
    const difference = (current[index] ?? 0) - (required[index] ?? 0);

    if (difference !== 0) return difference > 0;
  }

  return true;
};