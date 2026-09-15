import { getFirstDocPath } from "@/lib/docs/content";
import { redirect } from "next/navigation";

const Page = (): never => {
  redirect(`/${getFirstDocPath()}`);
};

export default Page;
