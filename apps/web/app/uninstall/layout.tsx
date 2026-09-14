import { createMetadata } from "@/lib/seo";
import type { PropsWithChildren, ReactElement } from "react";

export const metadata = createMetadata({
  title: "Uninstall Nowly",
  description: "Nowly uninstallation cleanup for this browser.",
  path: "/uninstall",
  noIndex: true,
});

const Layout = ({ children }: PropsWithChildren): ReactElement => children;

export default Layout;
