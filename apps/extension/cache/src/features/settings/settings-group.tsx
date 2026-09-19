import { Button } from "@/components/ui/button";
import { IconChevronDown } from "@/lib/tabler-icons";
import type { FC, ReactElement, ReactNode } from "react";

type Props = {
  children: ReactNode;
  id: string;
  onToggle: () => void;
  open: boolean;
  title: string;
};

export const SettingsGroup: FC<Props> = ({ children, id, onToggle, open, title }): ReactElement => {
  const panelId = `settings-group-${id}`;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <Button
        variant="unstyled"
        size="none"
        aria-controls={panelId}
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-card-hover"
      >
        <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{title}</span>
        <IconChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>
      {open ? (
        <div id={panelId} className="divide-y divide-border border-t border-border">
          {children}
        </div>
      ) : null}
    </section>
  );
};
