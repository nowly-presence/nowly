import { ButtonLink } from "@nowly/ui";
import type { Metadata } from "next";
import "./globals.css";
import { satoshi } from "./fonts";

// Bypasses the app's normal rendering (no access to next-intl / [locale] context), so this
// must import its own styles/fonts and stay plain English - see not-found.md "Good to know".
export const metadata: Metadata = {
  title: "Not Found | Nowly",
  description: "The page you are looking for does not exist.",
};

const GlobalNotFound = () => (
  <html lang="en" className={satoshi.variable}>
    <body className="min-h-dvh bg-background font-sans antialiased">
      <section className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-5 text-center">
        <h1 className="text-3xl font-medium text-foreground">Page not found</h1>
        <p className="mt-3 text-muted-foreground">This page doesn&apos;t exist or has moved.</p>
        <ButtonLink href="/" className="mt-8">
          Back home
        </ButtonLink>
      </section>
    </body>
  </html>
);

export default GlobalNotFound;
