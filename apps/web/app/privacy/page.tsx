import { PlaceholderPage, generatePlaceholderMetadata } from "@/components/placeholder-page";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  generatePlaceholderMetadata("privacy", "/privacy");

const Page = () => <PlaceholderPage pageKey="privacy" />;

export default Page;
