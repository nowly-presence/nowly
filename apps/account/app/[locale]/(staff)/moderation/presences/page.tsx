import { StaffPresences } from "@/features/staff/components/staff-presences";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <StaffPresences />;

export default Page;