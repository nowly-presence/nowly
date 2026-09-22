import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { generateMetadata, viewport } from "./metadata";

export { generateMetadata, viewport };

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

type LayoutProps = PropsWithChildren<{
  params: Promise<{ locale: string }>
}>;

const Layout = async ({ children, params }: LayoutProps) => {
  const [{ locale }, messages] = await Promise.all([params, getMessages()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CookieBanner />
    </NextIntlClientProvider>
  );
};

export default Layout;
