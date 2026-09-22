import { jsonLd } from "@/features/seo/lib/seo";

export const JsonLd = ({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
);
