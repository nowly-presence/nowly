import { getFirstDocPath } from "@/lib/docs/content";
import { redirect } from "next/navigation";

const Page = (): never => {
  redirect(`/docs/${getFirstDocPath()}`);
};

export default Page;
