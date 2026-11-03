import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";
import type { AdminError, SubmissionDetail } from "@/shared/admin/admin-types";

export type SubmissionDetailState = {
  detail: SubmissionDetail | null;
  error: AdminError | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export const useSubmissionDetail = (id: string | null): SubmissionDetailState => {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState<AdminError | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  const reload = useCallback(async () => {
    if (!id) return;

    const result = await sendMessage("SUBMISSION_GET_DETAIL", { id });
    setLoading(false);

    if (result.ok) {
      setDetail(result.data);
      setError(null);
    } else setError(result.error);
  }, [id]);

  useEffect(() => {
    setDetail(null);
    setLoading(Boolean(id));
    void reload();
  }, [id, reload]);

  return { detail, error, loading, reload };
};