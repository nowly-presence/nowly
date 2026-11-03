import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { PropsWithChildren } from "react";

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

const Layout = async ({ children, params }: PropsWithChildren<{
  params: Promise<{
    locale: string;
  }>;
}>) => {
  const { locale } = await params;

  if (!routing.locales.some((supported) => supported === locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
};

export default Layout;