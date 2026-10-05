import { CookieBanner } from "@/features/layout/components/cookie-banner";
import { Footer } from "@/features/layout/components/footer";
import { Navbar } from "@/features/layout/components/navbar";
import { SeasonBootScript } from "@/features/seasonal/components/season-boot-script";
import { SeasonProvider } from "@/features/seasonal/components/season-provider";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";
import { generateMetadata, viewport } from "./metadata";

export { generateMetadata, viewport };

const ALLOW_SEASON_PREVIEW = process.env.NODE_ENV !== "production";

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

type LayoutProps = PropsWithChildren<{
  params: Promise<{ locale: string }>
}>;

const Layout = async ({ children, params }: LayoutProps) => {
  const [{ locale }, messages] = await Promise.all([params, getMessages()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SeasonBootScript allowPreview={ALLOW_SEASON_PREVIEW} />
      <div className="relative flex min-h-dvh flex-col">
        <SeasonProvider allowPreview={ALLOW_SEASON_PREVIEW} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CookieBanner />
    </NextIntlClientProvider>
  );
};

export default Layout;
