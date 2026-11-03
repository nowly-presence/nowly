import type { LocaleString as LongLocale } from "@nowly/locales";
import { CREATOR_BUILTIN_STRINGS } from "./creator-builtin-strings";
import { pageKey, textIn } from "./creator-draft";
import type { CreatorDraft, CreatorPage, LocalizedText } from "./creator-types";

export const writtenLocales = (draft: CreatorDraft): LongLocale[] => {
  if (draft.translationMode === "auto") return [draft.baseLocale];

  return [draft.baseLocale, ...draft.locales.filter((locale) => locale !== draft.baseLocale)];
};

export const pageKeys = (pages: CreatorPage[]): string[] => {
  const used = new Map<string, number>();
  return pages.map((page, index) => {
    const base = pageKey(page, index);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}${count + 1}`;
  });
};

const localized = (draft: CreatorDraft, text: LocalizedText): Record<string, string> =>
  Object.fromEntries(
    writtenLocales(draft).flatMap((locale) =>
      textIn(text, locale)
        ? [
            [
              locale,
              textIn(text, locale)
            ]
          ]
        : []
    )
  );

const withFallback = (text: LocalizedText, locale: LongLocale, base: LongLocale): string => textIn(text, locale) || textIn(text, base);

export type StringKeys = {
  details: string;
  state?: string;
  button?: string;
};

export const pageStringKeys = (draft: CreatorDraft): StringKeys[] =>
  pageKeys(draft.pages).map((key, index) => {
    const page = draft.pages[index];
    return {
      details: `${key}Details`,
      state: textIn(page.state, draft.baseLocale) ? `${key}State` : undefined,
      button: page.button.enabled ? `${key}Button` : undefined
    };
  });

export const buildLocaleFiles = (draft: CreatorDraft): Record<string, Record<string, string>> => {
  const keys = pageStringKeys(draft);
  const base = draft.baseLocale;
  return Object.fromEntries(
    writtenLocales(draft).map((locale) => {
      const entries: [string, string][] = draft.pages.flatMap((page, index) => {
        const pageKeysFor = keys[index];
        const rows: [string, string][] = [
          [
            pageKeysFor.details,
            withFallback(page.details, locale, base)
          ]
        ];
        if (pageKeysFor.state) rows.push([
          pageKeysFor.state,
          withFallback(page.state, locale, base)
        ]);
        if (pageKeysFor.button) rows.push([
          pageKeysFor.button,
          withFallback(page.button.label, locale, base)
        ]);
        return rows;
      });
      if (draft.browsingFallback) entries.push(["browsing", CREATOR_BUILTIN_STRINGS[locale].browsing]);
      return [
        locale,
        Object.fromEntries(entries)
      ];
    })
  );
};

export const buildMetadata = (draft: CreatorDraft): Record<string, unknown> => {
  const features = Object.fromEntries(
    writtenLocales(draft).flatMap((locale) => {
      const items = draft.features.map((feature) => textIn(feature, locale)).filter(Boolean);
      return items.length > 0 ? [[locale, items]] : [];
    })
  );
  const longDescription = localized(draft, draft.longDescription);
  return {
    name: draft.name.trim(),
    author: {
      name: draft.author.name.trim(),
      ...(draft.author.github ? { github: draft.author.github } : draft.author.discord ? { discord: draft.author.discord } : {})
    },
    url: draft.domains,
    color: draft.color.toLowerCase(),
    category: draft.category,
    description: localized(draft, draft.description),
    ...(Object.keys(longDescription).length > 0 ? { longDescription } : {}),
    ...(Object.keys(features).length > 0 ? { features } : {})
  };
};