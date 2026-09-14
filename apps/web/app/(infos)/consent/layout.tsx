import { createMetadata } from "@/lib/seo";
import type { PropsWithChildren, ReactElement } from "react";

export const metadata = createMetadata({
  title: "Manage your Nowly data",
  description: "Export or delete the analytics data associated with your Nowly browser extension, and review your current consent status.",
  path: "/consent",
  noIndex: true,
});

const Layout = ({ children }: PropsWithChildren): ReactElement => <>{children}</>;

export default Layout;
