import { ProfileView } from "@/features/account/components/profile-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <ProfileView />;

export default Page;