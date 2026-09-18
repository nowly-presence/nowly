"use client";

import { Toaster, TooltipProvider } from "@nowly/ui";


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
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  </NuqsAdapter>
);
