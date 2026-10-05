import { seasonBootScript } from "@/features/seasonal/lib/site-season";

export const SeasonBootScript = ({ allowPreview }: { allowPreview: boolean }) => (
  <script dangerouslySetInnerHTML={{ __html: seasonBootScript(allowPreview) }} />
);
