import { StaffAnnouncements } from "@/features/staff/components/staff-announcements";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <StaffAnnouncements />;

export default Page;