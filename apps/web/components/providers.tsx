"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

export const AppProviders = ({ children }: PropsWithChildren) => (
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
);
