import { StaffReviewDetail } from "@/features/staff/components/staff-review-detail";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("submission-title", "submission-description");

const Page = async ({ params }: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await params;
  return <StaffReviewDetail id={id} />;
};

export default Page;
