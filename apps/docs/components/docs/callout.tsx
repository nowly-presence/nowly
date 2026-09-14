import { IconAlertCircle, IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import type { FC, ReactNode } from "react";

type CalloutType = "info" | "warning" | "error";

type CalloutProps = {
  type?: CalloutType;
  children: ReactNode;
};

const icons: Record<CalloutType, ReactNode> = {
  info: <IconInfoCircle size={18} className="shrink-0 mt-0.5 text-accent" />,
  warning: <IconAlertTriangle size={18} className="shrink-0 mt-0.5 text-warning" />,
  error: <IconAlertCircle size={18} className="shrink-0 mt-0.5 text-destructive" />,
};

const borders: Record<CalloutType, string> = {
  info: "border-accent/30 bg-accent/5",
  warning: "border-warning/30 bg-warning/5",
  error: "border-destructive/30 bg-destructive/5",
};

export const Callout: FC<CalloutProps> = ({ type = "info", children }) => {
  return (
    <div className={`flex gap-3 rounded-lg border p-4 my-6 ${borders[type]}`}>
      {icons[type]}
      <div className="text-sm leading-relaxed text-foreground/90 [&>p]:m-0">
        {children}
      </div>
    </div>
  );
};