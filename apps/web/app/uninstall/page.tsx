"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { trackPublicAnalytics } from "@/lib/analytics-client";
import { API_BASE_URL } from "@/lib/constants";
import { Check, LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Status = "idle" | "loading" | "done" | "error";
type DeleteStatus = "idle" | "loading" | "done" | "error" | "kept";

const UninstallPage = () => {
  const searchParams = useSearchParams();
  const deviceId = useMemo(() => searchParams.get("deviceId")?.trim() ?? "", [searchParams]);
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [status, setStatus] = useState<Status>("idle");
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>("idle");

  useEffect(() => {
    if (!deviceId || status !== "idle") return;

    setStatus("loading");
    trackPublicAnalytics({ key: "uninstall_cleanup_received", payload: { source: "uninstall-page" } });
    void fetch(`${API_BASE_URL}/devices/${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
      cache: "no-store",
      headers: token ? { "X-Device-Token": token } : undefined,
    })
      .then((response) => {
        setStatus(response.ok ? "done" : "error");
        trackPublicAnalytics({
          key: response.ok ? "uninstall_cleanup_success" : "uninstall_cleanup_error",
          payload: { source: "uninstall-page", stage: "active-cleanup" },
        });
      })
      .catch(() => {
        setStatus("error");
        trackPublicAnalytics({
          key: "uninstall_cleanup_error",
          payload: { source: "uninstall-page", stage: "active-cleanup" },
        });
      });
  }, [deviceId, token, status]);

  return (
    <PageLayout>
      <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
          {status === "done" ? (
            <Check className="h-6 w-6 text-emerald-500" />
          ) : status === "error" ? (
            <TriangleAlert className="h-6 w-6 text-warning" />
          ) : (
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>

        <h1 className="text-2xl font-semibold text-foreground">
          {status === "done" ? "Cleanup completed" : `Uninstalling Nowly...`}
        </h1>

        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          {status === "done"
            ? "Your device has been removed from the active presence counters."
            : status === "error"
              ? "The cleanup request failed. You can safely close this page; the counters will expire automatically."
              : "Removing your device from active counters..."}
        </p>

        {status === "done" && deviceId && deleteStatus !== "done" && deleteStatus !== "kept" && (
          <section className="mt-8 w-full rounded-lg border border-border bg-card p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">Usage data</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Your anonymous analytics can help us understand which presences work well and where Nowly needs improvement. You can delete them now if you prefer.
                </p>
                {deleteStatus === "error" && (
                  <p className="mt-2 text-xs text-warning">The deletion request failed. You can retry from this page.</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={deleteStatus === "loading"}
                    onClick={() => {
                      setDeleteStatus("loading");
                      void fetch(`${API_BASE_URL}/analytics/device/${encodeURIComponent(deviceId)}`, {
                        method: "DELETE",
                        cache: "no-store",
                        headers: token ? { "X-Device-Token": token } : undefined,
                      })
                        .then((response) => {
                          setDeleteStatus(response.ok ? "done" : "error");
                          if (response.ok) {
                            trackPublicAnalytics({ key: "uninstall_analytics_deleted", payload: { source: "uninstall-page" } });
                          }
                        })
                        .catch(() => setDeleteStatus("error"));
                    }}
                    className="inline-flex h-9 items-center rounded-lg border border-border bg-card-2 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:opacity-50"
                  >
                    {deleteStatus === "loading" ? "Deleting..." : "Delete them"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStatus("kept");
                      trackPublicAnalytics({ key: "uninstall_analytics_kept", payload: { source: "uninstall-page" } });
                    }}
                    className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Keep them
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {deleteStatus === "done" && (
          <p className="mt-6 text-sm text-muted-foreground">Your device-level analytics have been deleted.</p>
        )}

        {deleteStatus === "kept" && (
          <p className="mt-6 text-sm text-muted-foreground">Thanks. You can close this page.</p>
        )}
      </main>
    </PageLayout>
  );
};

export default UninstallPage;
