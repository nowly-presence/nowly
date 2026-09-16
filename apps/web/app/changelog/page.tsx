import { PlaceholderPage, generatePlaceholderMetadata } from "@/components/placeholder-page";
import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> =>
  generatePlaceholderMetadata("changelog", "/changelog");

const Page = () => <PlaceholderPage pageKey="changelog" />;

export default Page;
