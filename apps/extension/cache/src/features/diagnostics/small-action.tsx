import { Button } from "@/components/ui/button";
import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
};

export const SmallAction: FC<Props> = ({ children, onClick }) => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onClick}
    className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
  >
    {children}
  </Button>
);