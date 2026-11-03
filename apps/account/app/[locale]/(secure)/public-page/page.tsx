import { PublicPageView } from "@/features/account/components/public-page-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <PublicPageView />;

export default Page;