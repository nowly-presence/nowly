import { PageHeader } from "@/features/shell/components/page-header";
import type { PropsWithChildren } from "react";

export const AccountPageFrame = ({ title, description, children }: PropsWithChildren<{
  title: string;
  description: string;
}>) => (
  <>
    <PageHeader title={title} description={description} />
    {children}
  </>
);