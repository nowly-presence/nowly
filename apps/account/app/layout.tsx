import { LOCALE_SHORT_MAP, type LocaleString } from "@nowly/locales";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";
import "./globals.css";
import { satoshi } from "./fonts";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

const RootLayout = async ({ children }: PropsWithChildren) => {
  const locale = await getLocale();
  return (
    <html lang={LOCALE_SHORT_MAP[locale as LocaleString] ?? "en"} className={satoshi.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;