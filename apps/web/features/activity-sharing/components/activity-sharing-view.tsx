"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { publicationIdSchema, type ActivityPublication, type PublicationReview, type PublicationStatus, type PublicationResult } from "@nowly/shared/activity-publication";
import { requestExtension, subscribeExtensionDetected } from "@/lib/extension-bridge";
import { fetchActivityPublication } from "@/features/activity-sharing/lib/activity-publication";
import { ActivityPreview } from "@/features/activity-sharing/components/activity-preview";
import { ActivitySharingActions, type ActivityCopyChoice } from "@/features/activity-sharing/components/activity-sharing-actions";

const INSTALL_TIMEOUT_MS = 45_000;

export const ActivitySharingView = ({ id }: {
  id: string;
}) => {
  const t = useTranslations("activitySharing");
  const [publication, setPublication] = useState<ActivityPublication | null>(null);
  const [review, setReview] = useState<PublicationReview | null>(null);
  const [detected, setDetected] = useState(false);
  const [status, setStatus] = useState<PublicationStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => subscribeExtensionDetected(setDetected), []);
  useEffect(() => {
    let cancelled = false;

    if (!publicationIdSchema.safeParse(id).success) return;

    void fetchActivityPublication(id)
      .then(({ publication, review }) => {
        if (cancelled) return;

        setPublication(publication);
        setReview(review);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  useEffect(() => {
    if (!detected || !review) return;

    let cancelled = false;
    void requestExtension<PublicationStatus>("GET_ACTIVITY_PUBLICATION_STATUS", review)
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus({
          ok: false,
          error: "UNAVAILABLE"
        });
      });
    return () => {
      cancelled = true;
    };
  }, [detected, review]);
  const apply = async (choice: ActivityCopyChoice) => {
    if (!review || !status?.ok || busy) return false;

    setBusy(true);
    setMessage(null);

    try {
      const result = await requestExtension<PublicationResult>(
        "APPLY_ACTIVITY_PUBLICATION",
        {
          ...review,
          choice,
          localFingerprint: status.localFingerprint
        },
        INSTALL_TIMEOUT_MS
      );

      if (result.ok) setMessage(choice === "keep" ? t("kept") : null);
      else setMessage(t(result.error === "EDITOR_OPEN" ? "editorOpen" : "changed"));
      if (result.ok) setStatus(await requestExtension<PublicationStatus>("GET_ACTIVITY_PUBLICATION_STATUS", review));
      return result.ok;
    } catch {
      setMessage(t("changed"));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
      <p className="text-sm text-muted-foreground">{t("title")}</p>
      {!publication ? (
        <p role="status" className="mt-5">
          {t(unavailable || !publicationIdSchema.safeParse(id).success ? "unavailable" : "loading")}
        </p>
      ) : (
        <>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{publication.activity.name}</h1>
          <p className="mb-7 mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {t.rich("author", {
              name: publication.author.name,
              avatar: () =>
                publication.author.image ? (
                  <img src={publication.author.image} referrerPolicy="no-referrer" alt="" className="size-6 rounded-full object-cover" />
                ) : null,
              person: (name) => <span className="font-medium text-foreground">{name}</span>
            })}
          </p>
          <div className="rounded-3xl border border-border bg-card p-2 text-card-foreground" data-testid="activity-sharing-frame">
            <ActivityPreview activity={publication.activity} />
            <div className="flex flex-col gap-4 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-4">
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t("consent")}</p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <ActivitySharingActions detected={detected} status={status} revision={publication.revision} busy={busy} message={message} onApply={apply} />
              </div>
            </div>
            {message && (
              <p role="status" className="px-3 pb-4 text-sm text-muted-foreground sm:px-4">
                {message}
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
};