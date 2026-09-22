import { OverviewView } from "@/features/views/components/overview-view";
import { ViewPage } from "@/features/views/components/view-page";
import { DEFAULT_VIEWS, isDefaultViewSlug } from "@/features/views/lib/default-views";
import { notFound } from "next/navigation";

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  if (!isDefaultViewSlug(slug)) notFound();

  if (slug === "overview") {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-foreground">Overview</h1>
        <OverviewView />
      </div>
    );
  }

  return <ViewPage view={DEFAULT_VIEWS[slug]} canDuplicate />;
};

export default Page;
