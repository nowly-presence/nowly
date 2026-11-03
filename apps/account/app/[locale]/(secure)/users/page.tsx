import { UsersView } from "@/features/account/components/users-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <UsersView />;

export default Page;