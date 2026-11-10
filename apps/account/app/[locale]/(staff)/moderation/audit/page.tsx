import { StaffAudit } from "@/features/staff/components/staff-audit";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <StaffAudit />;

export default Page;