import { Skeleton } from "@/components/ui/skeleton";
import type { FC, ReactElement } from "react";

export const StoreSkeleton: FC = (): ReactElement => (
  <div className="flex flex-col gap-2">
    <Skeleton className="h-9 w-full" rounded="md" />
    <div className="flex gap-1.5">
      <Skeleton className="h-7 w-16" rounded="md" />
      <Skeleton className="h-7 w-20" rounded="md" />
      <Skeleton className="h-7 w-14" rounded="md" />
    </div>
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3">
          <Skeleton className="size-10 shrink-0" rounded="lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/6" />
            <Skeleton className="h-3 w-2/6" />
          </div>
          <Skeleton className="h-7 w-16 shrink-0" rounded="md" />
        </div>
      ))}
    </div>
  </div>
);
