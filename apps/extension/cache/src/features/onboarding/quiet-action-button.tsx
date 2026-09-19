import { Button } from "@/components/ui/button";
import type { FC, ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick: () => void;
};

export const QuietActionButton: FC<Props> = ({ children, onClick }) => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onClick}
    className="inline-flex h-8 items-center justify-center rounded-xl px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
  >
    {children}
  </Button>
);