import { Button } from "@/components/ui/button";
import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick: () => void;
};

export const LinkActionButton: FC<Props> = ({ children, onClick }) => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onClick}
    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
  >
    {children}
  </Button>
);