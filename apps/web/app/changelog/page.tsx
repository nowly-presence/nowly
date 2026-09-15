import { docsHref } from "@/lib/seo";
import { redirect } from "next/navigation";

const Page = (): never => {
  redirect(docsHref("/changelog"));
};

export default Page;
