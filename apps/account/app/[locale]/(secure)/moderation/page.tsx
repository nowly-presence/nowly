import { visibleModerationTabs } from "@/features/shell/lib/account-tabs";
import { redirect } from "@/i18n/navigation";
import { readServerSession } from "@/lib/server-session";
import { getLocale } from "next-intl/server";

const Page = async () => {
  const [user, locale] = await Promise.all([readServerSession(), getLocale()]);
  const [first] = visibleModerationTabs(user?.capabilities ?? []);

  redirect({
    href: first?.href ?? "/profile",
    locale
  });
};

export default Page;
