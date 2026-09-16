import { PlaceholderPage, generatePlaceholderMetadata } from "@/components/placeholder-page";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  generatePlaceholderMetadata("legal-notice", "/legal-notice");

const Page = () => <PlaceholderPage pageKey="legal-notice" />;

export default Page;
