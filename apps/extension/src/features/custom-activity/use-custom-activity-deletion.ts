import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";

type DeletionStage = "checking" | "blocked" | "withdraw" | "delete";

export const useCustomActivityDeletion = (id: string, onConfirm: () => Promise<boolean>) => {
  const { t } = useI18n();
  const [stage, setStage] = useState<DeletionStage>("checking");
  const [prepared, setPrepared] = useState(false);
  const [hasWithdrawal, setHasWithdrawal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const revision = useRef<number | null>(null);
  const locked = useRef(false);
  const mounted = useRef(false);
  const request = useRef(0);

  const failure = useCallback((code: string) =>
    t(
      code === "CREATOR_REQUIRED"
        ? "custom.delete.connectRequired"
        : code === "REVISION_CONFLICT"
          ? "custom.public.conflict"
          : "custom.delete.verifyPublication"
    ), [t]);

  const load = useCallback(async () => {
    const token = ++request.current;
    setStage("checking");
    setError(null);

    try {
      const plan = await sendMessage("GET_CUSTOM_ACTIVITY_DELETION_PLAN", { id });

      if (!mounted.current || token !== request.current) return;
      if (!plan.ok) {
        setError(failure(plan.error));
        setStage("blocked");
        return;
      }

      revision.current = plan.withdrawal?.revision ?? null;
      if (plan.withdrawal) setHasWithdrawal(true);
      setStage(plan.withdrawal ? "withdraw" : "delete");
    } catch {
      if (!mounted.current || token !== request.current) return;

      setError(failure("UNAVAILABLE"));
      setStage("blocked");
    } finally {
      if (mounted.current && token === request.current) setPrepared(true);
    }
  }, [id, failure]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      request.current += 1;
    };
  }, [load]);

  const withdraw = async () => {
    if (locked.current || stage !== "withdraw" || revision.current === null) return;

    locked.current = true;
    setBusy(true);
    setError(null);

    try {
      const result = await sendMessage("PUBLISH_CUSTOM_ACTIVITY", {
        id,
        baseRevision: revision.current,
        unpublish: true
      });

      if (!mounted.current) return;
      if (!result.ok || result.published) {
        setError(failure(result.ok ? "UNAVAILABLE" : result.error));
        setStage("blocked");
        return;
      }

      revision.current = result.revision;
      setStage("delete");
    } catch {
      if (mounted.current) {
        setError(failure("UNAVAILABLE"));
        setStage("blocked");
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const remove = async () => {
    if (locked.current || stage !== "delete") return;

    locked.current = true;
    setBusy(true);
    setError(null);

    try {
      const removed = await onConfirm();
      if (!removed && mounted.current) await load();
    } catch {
      if (mounted.current) {
        setError(failure("UNAVAILABLE"));
        setStage("blocked");
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return { stage, prepared, hasWithdrawal, error, busy, load, withdraw, remove };
};