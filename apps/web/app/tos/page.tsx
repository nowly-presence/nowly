import { PlaceholderPage, generatePlaceholderMetadata } from "@/components/placeholder-page";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  generatePlaceholderMetadata("tos", "/tos");

const Page = () => <PlaceholderPage pageKey="tos" />;

export default Page;
