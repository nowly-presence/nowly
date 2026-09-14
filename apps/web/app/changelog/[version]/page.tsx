import { parsePublicChangelogVersion } from "@/lib/docs/content";
import { notFound, permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{
    version: string;
  }>;
};

const Page = async ({ params }: Props): Promise<never> => {
  const { version } = await params;
  const parsed = parsePublicChangelogVersion(version);

  if (!parsed) {
    notFound();
  }

  permanentRedirect(`/docs/changelog/${parsed.docSlug}`);
};

export default Page;
