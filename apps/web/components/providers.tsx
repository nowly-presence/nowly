"use client";

import { ThemeUrlOverride } from "@/features/layout/components/theme-url-override";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <NuqsAdapter>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeUrlOverride />
      {children}
    </ThemeProvider>
  </NuqsAdapter>
);
