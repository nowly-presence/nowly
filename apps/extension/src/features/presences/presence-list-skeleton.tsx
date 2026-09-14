import { Skeleton } from "@/components/ui/skeleton";
import type { PresenceDisplayMode } from "@/shared/types";
import type { FC } from "react";

type Props = {
  displayMode: PresenceDisplayMode;
};

export const PresenceListSkeleton: FC<Props> = ({ displayMode }) => {
  const layout = displayMode === "grid" ? "grid" : "list";

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-10 shrink-0" rounded="md" />
      </div>
      {layout === "grid" ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start gap-2.5">
                <Skeleton className="size-11 shrink-0" rounded="lg" />
                <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-10 shrink-0" rounded="lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/6" />
                <Skeleton className="h-3 w-2/6" />
              </div>
              <Skeleton className="h-5 w-8 shrink-0" rounded="full" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
