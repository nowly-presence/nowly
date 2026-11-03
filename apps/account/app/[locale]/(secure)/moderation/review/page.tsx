import { ReviewView } from "@/features/account/components/review-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <ReviewView />;

export default Page;