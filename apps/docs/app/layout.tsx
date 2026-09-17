import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { AppProviders } from "@/components/providers";
import { BRAND_FAVICON_32, BRAND_METADATA_ICONS } from "@/lib/brand";
import { isSeoPreview } from "@/lib/constants";
import { OG_IMAGE_VERSION } from "@/lib/seo";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import type { PropsWithChildren, ReactElement } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nowly Docs",
    template: "%s | Nowly",
  },
  description: "Install Nowly, build presences, and publish Discord Rich Presence integrations.",
  metadataBase: new URL("https://docs.nowly.me"),
  robots: isSeoPreview
    ? { index: false, follow: false, nocache: true }
    : { index: true, follow: true },
  manifest: "/manifest.json",
  icons: {
    ...BRAND_METADATA_ICONS,
    shortcut: BRAND_FAVICON_32,
  },
  openGraph: {
    images: [{ url: `/api/og/docs?mode=dark&v=${OG_IMAGE_VERSION}`, width: 1200, height: 630, alt: "Nowly Docs" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef5fc" },
    { media: "(prefers-color-scheme: dark)", color: "#07080c" },
  ],
  width: "device-width",
  initialScale: 1,
};

const localeToHtmlLang: Record<string, string> = {
  "en-US": "en",
  "fr-FR": "fr",
  "es-ES": "es",
};

const Layout = async ({ children }: PropsWithChildren): Promise<ReactElement> => {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <html lang={localeToHtmlLang[locale] ?? "en"} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>
            <div className="flex min-h-dvh min-w-0 flex-col">
              <Navbar />
              <main className="flex min-w-0 flex-1 flex-col">{children}</main>
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
