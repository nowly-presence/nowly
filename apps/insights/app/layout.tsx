import { AppProviders } from "@/components/providers";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nowly Insights",
  description: "Internal analytics dashboard for Nowly.",
  robots: { index: false, follow: false },
};

const Layout = ({ children }: PropsWithChildren) => (
  <html lang="en" suppressHydrationWarning>
    <body className="min-h-dvh bg-background font-sans antialiased" suppressHydrationWarning>
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

export default Layout;
