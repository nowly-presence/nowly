import type { Metadata } from "next";
import { ActivitySharingView } from "@/features/activity-sharing/components/activity-sharing-view";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

const Page = async ({ params }: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await params;
  return <ActivitySharingView id={id} />;
};

export default Page;