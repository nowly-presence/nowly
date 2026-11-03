import { useCallback, useEffect, useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { sendMessage } from "@/lib/messages";
import type { CreatorAccount } from "@/shared/creator/creator-submission";

export const useCreatorAccount = () => {
  const { state } = useExtensionState();
  const [account, setAccount] = useState<CreatorAccount | null>(null);
  const [connecting, setConnecting] = useState(false);

  const refresh = useCallback(async () => setAccount(await sendMessage("CREATOR_GET_ACCOUNT")), []);

  useEffect(() => {
    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh, state.account]);

  const connect = async () => {
    if (connecting) return;

    setConnecting(true);

    try {
      await sendMessage("START_CREATOR_CONNECT");
      await refresh();
    } finally {
      setConnecting(false);
    }
  };

  return { account, connecting, connect, refresh };
};