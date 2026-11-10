import { StaffReviewBoard } from "@/features/staff/components/staff-review-board";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("account-title", "account-description");

const Page = () => <StaffReviewBoard />;

export default Page;