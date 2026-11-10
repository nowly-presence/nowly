import { StaffUsers } from "@/features/staff/components/staff-users";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <StaffUsers />;

export default Page;