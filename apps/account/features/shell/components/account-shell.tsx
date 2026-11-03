import { AccountNav } from "@/features/shell/components/account-nav";
import { siteBaseUrl } from "@/lib/api-base";
import type { PropsWithChildren } from "react";
import { getTranslations } from "next-intl/server";

export const AccountShell = async ({ staff, children }: PropsWithChildren<{
  staff: boolean;
}>) => {
  const t = await getTranslations("shell");

  const account = await getTranslations("accountPage");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="text-sm font-semibold tracking-tight text-foreground">Nowly {account("eyebrow")}</p>
            <AccountNav staff={staff} />
          </div>
          <a href={siteBaseUrl()} className="text-sm text-foreground/60 underline-offset-4 hover:text-foreground hover:underline">
            {t("back-to-site")}
          </a>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
    </div>
  );
};