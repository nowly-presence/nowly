import { Button } from "@/components/ui/button";
import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
};

export const ActionButton: FC<Props> = ({ children, onClick, primary = false }) => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onClick}
    className={
      primary
        ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card-2 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
    }
  >
    {children}
  </Button>
);