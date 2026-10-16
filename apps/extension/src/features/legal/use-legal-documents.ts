import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeLegalState, type LegalConfirmation, type LegalState } from "@nowly/shared/legal";
import { sendMessage } from "@/lib/messages";

export const useLegalDocuments = () => {
  const [state, setState] = useState<LegalState | null>(null);
  const [failed, setFailed] = useState(false);
  const revision = useRef(0);
  const load = useCallback(async () => {
    const currentRevision = revision.current;

    try {
      const cached = await sendMessage("GET_LEGAL_STATE");
      if (revision.current === currentRevision) setState(cached);
      setFailed(false);
      await sendMessage("CHECK_LEGAL_DOCUMENTS");
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !("legalDocuments" in changes)) return;

      revision.current += 1;
      setState(normalizeLegalState(changes.legalDocuments.newValue));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const interval = window.setInterval(
      () => {
        if (document.visibilityState === "visible") void load();
      },
      60 * 60 * 1000
    );
    chrome.storage.onChanged.addListener(onChange);
    void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      chrome.storage.onChanged.removeListener(onChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);
  const confirm = async (input: LegalConfirmation) => {
    const currentRevision = revision.current;
    const result = await sendMessage("ACCEPT_LEGAL_DOCUMENTS", input);
    if (revision.current === currentRevision) setState(result.state);
    return result;
  };
  return {
    state,
    failed,
    retry: load,
    confirm
  };
};