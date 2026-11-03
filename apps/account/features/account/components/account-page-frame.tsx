import { AccountHeader } from "@/features/account/components/account-header";
import type { PropsWithChildren, ReactNode } from "react";

export const AccountPageFrame = ({ eyebrow, title, description, action, children }: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}>) => (
  <div className="pb-24 pt-12 sm:pb-32 sm:pt-16">
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
      <AccountHeader eyebrow={eyebrow} title={title} description={description} action={action} />
      <div className="mt-10">{children}</div>
    </div>
  </div>
);