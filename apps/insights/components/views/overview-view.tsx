"use client";

import { Card, CardContent, CardDescription, CardTitle, Skeleton } from "@nowly/ui";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";

type OverviewResponse = {
  totals: { events: number; uniqueDevices: number };
  topEvents: Array<{ key: string; count: number }>;
  funnels: Array<{ id: string; label: string; overallConversion: number | null }>;
};

export const OverviewView = () => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<OverviewResponse>("/insights/overview?range=7d")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-muted-foreground">Could not load the overview.</p>;
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <CardDescription>Total events (7d)</CardDescription>
            <CardTitle className="mt-1 text-3xl font-semibold">{data.totals.events.toLocaleString()}</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <CardDescription>Unique devices (7d)</CardDescription>
            <CardTitle className="mt-1 text-3xl font-semibold">{data.totals.uniqueDevices.toLocaleString()}</CardTitle>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <CardDescription>Top events</CardDescription>
          <div className="mt-3 space-y-1">
            {data.topEvents.map((event) => (
              <div key={event.key} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{event.key}</span>
                <span className="text-muted-foreground">{event.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <CardDescription>Funnels</CardDescription>
          <div className="mt-3 space-y-1">
            {data.funnels.map((funnel) => (
              <div key={funnel.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{funnel.label}</span>
                <span className="text-muted-foreground">{funnel.overallConversion ?? "—"}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
