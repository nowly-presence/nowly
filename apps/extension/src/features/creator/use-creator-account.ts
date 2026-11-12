import { useCallback, useEffect, useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { sendMessage } from "@/lib/messages";
import type { CreatorAccount } from "@nowly/presence-creator/creator-submission";

export const useCreatorAccount = () => {
  const { state } = useExtensionState();
  const [account, setAccount] = useState<CreatorAccount | null>(null);

  const refresh = useCallback(async () => setAccount(await sendMessage("CREATOR_GET_ACCOUNT")), []);

  useEffect(() => {
    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh, state.account]);

  return { account, refresh };
};