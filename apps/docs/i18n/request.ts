import { createRequestConfig } from "@nowly/locales/request";
import englishMessages from "../messages/en-US.json";

const withEnglishFallback = (messages: Record<string, unknown>): Record<string, unknown> => ({
  ...englishMessages,
  ...messages,
  docsUi: { ...englishMessages.docsUi, ...(messages.docsUi as Record<string, unknown> | undefined) },
  docsMetadata: { ...englishMessages.docsMetadata, ...(messages.docsMetadata as Record<string, unknown> | undefined) },
});

export default createRequestConfig(
  async (locale) => withEnglishFallback((await import(`../messages/${locale}.json`)).default),
);
