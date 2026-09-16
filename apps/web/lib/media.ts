import { existsSync } from "node:fs";
import path from "node:path";
import { FALLBACK_LOCALE, type LocaleString } from "@nowly/locales";

const toPublicFile = (urlPath: string): string =>
  path.join(process.cwd(), "public", urlPath.replace(/^\//, ""));

export const localizedMedia = (locale: LocaleString, group: string, file: string): string => {
  const candidates = [
    `/media/${group}/${locale}/${file}`,
    `/media/${group}/${FALLBACK_LOCALE}/${file}`,
    `/media/${group}/default/${file}`,
  ];

  return candidates.find((candidate) => existsSync(toPublicFile(candidate))) ?? candidates[candidates.length - 1];
};

export const getHeroMedia = (locale: LocaleString) => ({
  back: localizedMedia(locale, "hero", "card-back.png"),
  mid: localizedMedia(locale, "hero", "card-mid.png"),
  front: localizedMedia(locale, "hero", "card-front.png"),
});
