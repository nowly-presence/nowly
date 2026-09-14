import { docsHref } from "@/lib/seo";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ version: string }>
};

const Page = async ({ params }: Props): Promise<never> => {
  const { version } = await params;
  const match = /^(\d+)[.-](\d+)[.-](\d+)$/.exec(version.trim().replace(/^v/i, ""));
  if (!match) notFound();
  redirect(docsHref(`/docs/changelog/${match[1]}-${match[2]}-${match[3]}`));
};

export default Page;
