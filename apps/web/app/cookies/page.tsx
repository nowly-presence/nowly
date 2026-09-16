import { PlaceholderPage, generatePlaceholderMetadata } from "@/components/placeholder-page";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  generatePlaceholderMetadata("cookies", "/cookies");

const Page = () => <PlaceholderPage pageKey="cookies" />;

export default Page;
