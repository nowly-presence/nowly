import { SignInView } from "@/features/account/components/sign-in-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <SignInView />;

export default Page;