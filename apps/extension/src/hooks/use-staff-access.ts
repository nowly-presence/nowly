import { useCallback, useEffect, useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { sendMessage } from "@/lib/messages";
import type { StaffAccess } from "@/shared/admin/admin-types";
import type { AdminCapability } from "@nowly/shared/roles";

export const useStaffAccess = () => {
  const { state } = useExtensionState();
  const signedIn = state.account.signedIn;
  const [access, setAccess] = useState<StaffAccess | null>(null);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const refresh = useCallback(async () => {
    setAccess(await sendMessage("ADMIN_GET_ACCESS"));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!signedIn) {
      setAccess(null);
      setReady(true);
      return;
    }

    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [signedIn, refresh]);

  const connect = async () => {
    if (connecting) return;

    setConnecting(true);

    try {
      await sendMessage("START_ADMIN_CONNECT");
    } finally {
      setConnecting(false);
    }
  };

  const isStaff = Boolean(access && access.capabilities.length > 0);
  const can = (capability: AdminCapability): boolean => Boolean(access?.granted && access.capabilities.includes(capability));

  return { access, ready, isStaff, can, connecting, connect, refresh };
};