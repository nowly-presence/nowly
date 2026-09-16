import { PlaceholderPage, generatePlaceholderMetadata } from "@/components/placeholder-page";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  generatePlaceholderMetadata("host", "/host");

const Page = () => <PlaceholderPage pageKey="host" />;

export default Page;
