import type { Metadata } from "next";
import { OgPreview } from "./og-preview";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const Page = () => <OgPreview />;

export default Page;
