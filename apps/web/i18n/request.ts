import { createRequestConfig } from "@nowly/locales/request";

export default createRequestConfig(
  async (locale) => (await import(`../messages/${locale}.json`)).default,
);
