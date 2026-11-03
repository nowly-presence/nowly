import { CreationsView } from "@/features/account/components/creations-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <CreationsView />;

export default Page;