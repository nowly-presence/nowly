import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AppProviders } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";
import "./globals.css";
import { generateMetadata, viewport } from "./metadata";

export { generateMetadata, viewport };

const localeToHtmlLang: Record<string, string> = {
  "en-US": "en",
  "fr-FR": "fr",
  "es-ES": "es",
};

const Layout = async ({ children }: PropsWithChildren) => {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <html lang={localeToHtmlLang[locale] ?? "en"} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            <div className="flex min-h-dvh flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <CookieBanner />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default Layout;
