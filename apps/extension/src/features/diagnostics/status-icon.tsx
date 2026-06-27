import { IconCircleCheckFilled, IconLoader2, IconCircleX } from "@tabler/icons-react";
import type { FC } from "react";

export type RowStatus = "loading" | "success" | "error";

type Props = {
  status: RowStatus;
};

export const StatusIcon: FC<Props> = ({ status }) => {
  if (status === "loading") {
    return <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (status === "success") {
    return <IconCircleCheckFilled className="h-4 w-4 text-success" />;
  }

  return <IconCircleX className="h-4 w-4 text-destructive" />;
};