import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { CookieBanner } from "@/features/layout/components/cookie-banner";
import { Footer } from "@/features/layout/components/footer";
import { Navbar } from "@/features/layout/components/navbar";
import { AppProviders } from "@/components/providers";
import { BRAND_FAVICON_32, BRAND_METADATA_ICONS } from "@/lib/brand";
import { isSeoPreview } from "@/lib/constants";
import { OG_IMAGE_VERSION } from "@/features/seo/lib/seo";
import { LOCALE_SHORT_MAP, type LocaleString } from "@nowly/locales";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import type { PropsWithChildren, ReactElement } from "react";
import "../globals.css";
import { satoshi } from "../fonts";

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

type LayoutProps = PropsWithChildren<{
  params: Promise<{ locale: LocaleString }>
}>;

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations("docsMetadata");
  const languages: Record<string, string> = {
    "x-default": `https://docs.nowly.me${getPathname({ locale: routing.defaultLocale, href: "/" })}`,
  };
  for (const target of routing.locales) {
    languages[target] = `https://docs.nowly.me${getPathname({ locale: target, href: "/" })}`;
  }

  return {
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    metadataBase: new URL("https://docs.nowly.me"),
    alternates: {
      canonical: `https://docs.nowly.me${getPathname({ locale, href: "/" })}`,
      languages,
    },
    robots: isSeoPreview
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    manifest: "/manifest.json",
    icons: {
      ...BRAND_METADATA_ICONS,
      shortcut: BRAND_FAVICON_32,
    },
    openGraph: {
      images: [{ url: `/api/og/docs?mode=dark&v=${OG_IMAGE_VERSION}`, width: 1200, height: 630, alt: t("title") }],
    },
  };
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef5fc" },
    { media: "(prefers-color-scheme: dark)", color: "#07080c" },
  ],
  width: "device-width",
  initialScale: 1,
};

const Layout = async ({ children }: PropsWithChildren): Promise<ReactElement> => {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <html lang={LOCALE_SHORT_MAP[locale as LocaleString] ?? "en"} className={satoshi.variable} suppressHydrationWarning>
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
