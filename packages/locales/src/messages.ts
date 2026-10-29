import { FALLBACK_LOCALE, type LocaleString } from "@nowly/locales";

type MessageValue = string | number | boolean | null | MessageTree | MessageValue[];
export type MessageTree = {
  [key: string]: MessageValue;
};
export type MessageLoader = () => Promise<{
  default: MessageTree;
}>;

export const loadCatalog = async (catalogs: Record<LocaleString, MessageLoader>, locale: LocaleString): Promise<MessageTree> => {
  const [english, translated] = await Promise.all([
    catalogs[FALLBACK_LOCALE](),
    catalogs[locale]()
  ]);
  return mergeMessages(english.default, translated.default);
};

const isMessageTree = (value: MessageValue | undefined): value is MessageTree => value !== null && typeof value === "object" && !Array.isArray(value);

export const mergeMessages = (base: MessageTree, translated: MessageTree): MessageTree => {
  const result: MessageTree = { ...base };

  for (const [key, value] of Object.entries(translated)) {
    const original = result[key];
    result[key] = isMessageTree(value) && isMessageTree(original) ? mergeMessages(original, value) : value;
  }

  return result;
};