import { PresencesView } from "@/features/account/components/presences-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <PresencesView />;

export default Page;