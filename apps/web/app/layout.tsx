import { AppProviders } from "@/components/providers";
import { LOCALE_SHORT_MAP, type LocaleString } from "@nowly/locales";
import { getLocale } from "next-intl/server";
import Script from "next/script";
import type { PropsWithChildren } from "react";
import "./globals.css";
import { satoshi } from "./fonts";

// Sits above app/[locale] so ThemeProvider (and its FOUC-prevention script tag) stays
// mounted across locale switches instead of remounting every time [locale] changes.
const RootLayout = async ({ children }: PropsWithChildren) => {
  const locale = await getLocale();

  return (
    <html lang={LOCALE_SHORT_MAP[locale as LocaleString] ?? "en"} className={satoshi.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
        <Script id="plausible-init" strategy="beforeInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}}; plausible.init()`}
        </Script>
        <Script
          id="plausible-tracker"
          src="https://stats.nowly.me/js/pa-r-Hjx56OrHZObH3UiiIqy.js"
          strategy="afterInteractive"
          async
        />
      </body>
    </html>
  );
};

export default RootLayout;
