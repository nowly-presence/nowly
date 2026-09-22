import { permanentRedirect } from "@/i18n/navigation";
import { getFirstDocPath } from "@/features/docs-content/lib/content";
import { getLocale } from "next-intl/server";

const Page = async (): Promise<never> => {
  const locale = await getLocale();
  return permanentRedirect({ href: `/${getFirstDocPath()}`, locale });
};

export default Page;
