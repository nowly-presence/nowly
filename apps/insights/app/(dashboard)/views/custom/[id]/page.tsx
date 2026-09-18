import { ViewPage } from "@/components/views/view-page";
import { API_TARGET_COOKIE, apiBaseUrlFor, resolveApiTarget } from "@/lib/api-target";
import { ButtonLink } from "@nowly/ui";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import type { ViewConfig } from "@nowly/analytics";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const target = resolveApiTarget(cookieStore.get(API_TARGET_COOKIE)?.value);

  const res = await fetch(`${apiBaseUrlFor(target)}/insights/views/${id}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });
  if (!res.ok) notFound();
  const view: ViewConfig = await res.json();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ButtonLink href={`/views/custom/${id}/edit`} variant="outline" size="sm">
          Edit
        </ButtonLink>
      </div>
      <ViewPage view={view} />
    </div>
  );
};

export default Page;
