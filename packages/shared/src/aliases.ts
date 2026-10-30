import { PRESENCE_ALIAS_PATTERN, PRESENCE_ALIASES_MAX, SLUG_MAX_LENGTH } from "./constants";

export type PresenceAliasEntry = {
  slug: string;
  metadata: Record<string, unknown> | null | undefined;
};

/** Valid string aliases declared in presence metadata, lowercased. */
export const presenceAliases = (metadata: unknown): string[] => {
  if (!metadata || typeof metadata !== "object") return [];

  const aliases = (
    metadata as {
      aliases?: unknown;
    }
  ).aliases;

  if (!Array.isArray(aliases)) return [];

  return aliases.flatMap((alias) => (typeof alias === "string" && alias.trim() ? [alias.trim().toLowerCase()] : []));
};

/**
 * Library URL aliases must be lowercase slugs that no other presence already
 * uses as its slug or alias, so `/library/<alias>` resolves to one presence.
 * Same rules as `nowly validate`, the presences Nolo check and `pnpm admin push`.
 */
export const getPresenceAliasIssues = (presence: PresenceAliasEntry, presences: PresenceAliasEntry[]): string[] => {
  const issues: string[] = [];
  const others = presences.filter((other) => other.slug !== presence.slug);

  const slugOwner = others.find((other) => presenceAliases(other.metadata).includes(presence.slug));
  if (slugOwner) issues.push(`Slug "${presence.slug}" is already an alias of "${slugOwner.slug}"`);

  const aliases = presence.metadata?.aliases;

  if (aliases == null) return issues;
  if (!Array.isArray(aliases)) return [...issues, "metadata.aliases must be an array of strings"];

  if (aliases.length > PRESENCE_ALIASES_MAX) issues.push(`metadata.aliases accepts at most ${PRESENCE_ALIASES_MAX} entries`);

  const seen = new Set<string>();

  for (const alias of aliases) {
    if (typeof alias !== "string") {
      issues.push("metadata.aliases must only contain strings");
      continue;
    }
    if (alias.length > SLUG_MAX_LENGTH || !PRESENCE_ALIAS_PATTERN.test(alias)) {
      issues.push(`Alias "${alias}" must use lowercase letters, digits, dots or hyphens (max ${SLUG_MAX_LENGTH} characters)`);
      continue;
    }
    if (alias === presence.slug) {
      issues.push(`Alias "${alias}" duplicates the presence slug`);
      continue;
    }
    if (seen.has(alias)) {
      issues.push(`Alias "${alias}" is listed more than once`);
      continue;
    }

    seen.add(alias);

    const owner = others.find((other) => other.slug === alias);

    if (owner) {
      issues.push(`Alias "${alias}" is already the slug of "${owner.slug}"`);
      continue;
    }

    const aliasOwner = others.find((other) => presenceAliases(other.metadata).includes(alias));
    if (aliasOwner) issues.push(`Alias "${alias}" is already an alias of "${aliasOwner.slug}"`);
  }

  return issues;
};