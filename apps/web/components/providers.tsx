"use client";

import { Toaster, TooltipProvider } from "@nowly/ui";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";
import { ThemeUrlOverride } from "@/features/layout/components/theme-url-override";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <NuqsAdapter>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeUrlOverride />
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  </NuqsAdapter>
);
