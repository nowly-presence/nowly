import { SubmissionView } from "@/features/account/components/submission-view";
import { accountMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => accountMetadata("submission-title", "submission-description");

const Page = async ({ params }: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await params;
  return <SubmissionView id={id} />;
};

export default Page;