import { buildPresenceSeoPath } from "@/lib/seo-presence";
import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{
    item: string
  }>
};

const Page = async ({ params }: Props): Promise<never> => {
  const { item: raw } = await params;
  permanentRedirect(buildPresenceSeoPath(raw.toLowerCase()));
};

export default Page;
