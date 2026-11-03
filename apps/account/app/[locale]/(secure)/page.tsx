import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

const Page = async () => {
  redirect({
    href: "/profile",
    locale: await getLocale()
  });
};

export default Page;