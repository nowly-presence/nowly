"use client";

import { useSessionUser } from "@/features/account/components/session-provider";
import { fetchSubmission, SubmissionRequestError, type SubmissionDetail } from "@/features/account/lib/submission-api";
import { allowedVerdicts, canPublishSubmission } from "@nowly/presence-creator/creator-submission-policy";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export type SubmissionLoad = "checking" | "not-found" | "ready" | "error";

export const useSubmission = (id: string, fallbackError?: string) => {
  const t = useTranslations("submissionPage");
  const user = useSessionUser();
  const [load, setLoad] = useState<SubmissionLoad>("checking");
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    try {
      setDetail(await fetchSubmission(id));
      setLoad("ready");
    } catch (failure) {
      setLoad(failure instanceof SubmissionRequestError && failure.status === 404 ? "not-found" : "error");
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const act = async (action: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError(null);

    try {
      await action();
    } catch (failure) {
      if (failure instanceof SubmissionRequestError && failure.code === "STALE_REVISION") setError(t("error-stale"));
      else if (failure instanceof SubmissionRequestError && failure.status === 403) setError(t("error-forbidden"));
      else setError(fallbackError ?? t("action-error"));

      setBusy(false);

      return false;
    }

    await reload();
    setBusy(false);

    return true;
  };

  const isAuthor = detail?.author?.id === user.id;

  return {
    load,
    detail,
    busy,
    error,
    act,
    reviewer: user.capabilities.includes("review") && !isAuthor,
    publisher: user.capabilities.includes("publish"),
    canPublish: user.capabilities.includes("publish") && detail !== null && canPublishSubmission(detail.status),
    verdicts: detail ? allowedVerdicts(detail.status) : []
  };
};