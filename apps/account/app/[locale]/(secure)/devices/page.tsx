import { DevicesView } from "@/features/account/components/devices-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <DevicesView />;

export default Page;