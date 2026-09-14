import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { BRAND_LOCKUP_BLUE_PNG, BRAND_METADATA_ICONS } from "@/lib/brand";
import { geist, instrumentSans } from "./fonts";
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
  manifest: "/manifest.json",
  icons: BRAND_METADATA_ICONS,
  openGraph: {
    images: [{ url: BRAND_LOCKUP_BLUE_PNG, width: 1200, height: 630, alt: "Nowly" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#22d3ee",
  width: "device-width",
  initialScale: 1,
};

const Layout = async ({ children }: PropsWithChildren): Promise<ReactElement> => {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${instrumentSans.variable} ${geist.variable} bg-background scroll-smooth`}
    >
      <body className="font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-screen min-w-0 flex-col">
            <Navbar />
            <main className="flex min-w-0 flex-1 flex-col">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default Layout;
