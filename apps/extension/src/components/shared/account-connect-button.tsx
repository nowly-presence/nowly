import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { RiDiscordFill } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import type { AccountConnectPermission } from "@/shared/types";
import { Button } from "@/ui/button";
import { useToast } from "@/ui/toast";

type AccountConnectButtonProps = Omit<ComponentProps<typeof Button>, "onClick" | "loading" | "children" | "icon"> & {
  icon?: ReactNode;
  permission?: AccountConnectPermission | null;
  children?: ReactNode;
  onOpened?: () => void;
};

export const AccountConnectButton = ({ permission = null, children, icon, onOpened, disabled, ...props }: AccountConnectButtonProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);

  const connect = async (): Promise<void> => {
    if (locked.current) return;

    locked.current = true;
    setBusy(true);

    try {
      const result = await sendMessage("START_ACCOUNT_CONNECT", { permission });

      if (result.ok) {
        toast(t("account.signInOpened"), "info");
        onOpened?.();
      } else {
        toast(t("error.generic"), "error");
      }
    } catch {
      toast(t("error.generic"), "error");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled}
      loading={busy}
      icon={icon === undefined ? <RiDiscordFill className="size-4" /> : icon}
      onClick={() => void connect()}
    >
      {children ?? t("account.signIn")}
    </Button>
  );
};