import { z } from "zod";
import { FALLBACK_LOCALE, isValidLocale, SUPPORTED_LOCALES, type LocaleString } from "./codes";

export * from "./codes";

export type LocalizedValue<T = string> = Partial<Record<LocaleString, T>>;

export const getValidLocale = (locale: string, fallback: LocaleString = FALLBACK_LOCALE): LocaleString => (isValidLocale(locale) ? locale : fallback);

export const buildLocaleObject = <T>(value: T): Record<LocaleString, T> =>
  Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, value])) as Record<LocaleString, T>;

export const buildLocalizedValue = <T>(map: Partial<Record<LocaleString, T>>, fallback: T): Record<LocaleString, T> =>
  Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, map[l] ?? fallback])) as Record<LocaleString, T>;

export const LocaleRecordSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object(Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, valueSchema]))) as z.ZodObject<Record<LocaleString, T>>;