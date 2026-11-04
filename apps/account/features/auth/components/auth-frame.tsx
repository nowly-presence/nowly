"use client";

import { BrandLockup } from "@/features/shell/components/brand-lockup";
import { siteBaseUrl } from "@/lib/api-base";
import { useTranslations } from "next-intl";
import type { PropsWithChildren } from "react";

export const AuthFrame = ({ children }: PropsWithChildren) => {
  const shell = useTranslations("shell");
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <BrandLockup width={112} height={45} className="h-10 w-auto" />
      <div className="w-full max-w-sm">{children}</div>
      <a href={siteBaseUrl()} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {shell("back-to-site")}
      </a>
    </main>
  );
};
