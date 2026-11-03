import { ExtensionConnectView } from "@/features/account/components/extension-connect-view";
import { accountMetadata } from "@/lib/page-metadata";
import { Suspense } from "react";

export const generateMetadata = () => accountMetadata("connect-title", "connect-description");

const Page = () => (
  <Suspense>
    <ExtensionConnectView />
  </Suspense>
);

export default Page;