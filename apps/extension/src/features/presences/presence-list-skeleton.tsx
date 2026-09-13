import { Skeleton } from "@/components/ui/skeleton";
import type { FC } from "react";

export const PresenceListSkeleton: FC = () => (
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
);
