import { StaffOverview } from "@/features/staff/components/staff-overview";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <StaffOverview />;

export default Page;