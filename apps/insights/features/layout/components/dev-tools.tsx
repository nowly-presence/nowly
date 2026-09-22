"use client";

import { getClientApiTarget } from "@/features/api-target/lib/api-target";
import { apiFetch } from "@/features/api-target/lib/api-client";
import { Button, toast } from "@nowly/ui";
import { RiDatabase2Line, RiDeleteBinLine } from "@nowly/ui/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const DevTools = () => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState<"seed" | "clear" | null>(null);

  useEffect(() => {
    setVisible(getClientApiTarget() === "dev");
  }, []);

  if (!visible) return null;

  const seed = async () => {
    setLoading("seed");
    try {
      const result = await apiFetch<{ devices: number; events: number }>("/insights/dev/seed", {
        method: "POST",
        body: JSON.stringify({ days: 10 }),
      });
      toast.success(`Seeded ${result.events} events across ${result.devices} devices`);
      router.refresh();
    } catch {
      toast.error("Could not seed fake data");
    } finally {
      setLoading(null);
    }
  };

  const clear = async () => {
    setLoading("clear");
    try {
      const result = await apiFetch<{ devices: number; events: number }>("/insights/dev/clear", { method: "POST" });
      toast.success(`Cleared ${result.events} events and ${result.devices} devices`);
      router.refresh();
    } catch {
      toast.error("Could not clear fake data");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-dashed border-sidebar-border p-2">
      <span className="px-1 text-[0.65rem] font-medium uppercase tracking-wide text-sidebar-foreground/50">Dev data</span>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={seed} disabled={loading !== null}>
          <RiDatabase2Line data-icon="inline-start" />
          {loading === "seed" ? "Seeding..." : "Seed 10d"}
        </Button>
        <Button variant="outline" size="sm" onClick={clear} disabled={loading !== null} aria-label="Clear fake data">
          <RiDeleteBinLine />
        </Button>
      </div>
    </div>
  );
};
