import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import type { FC, ReactElement } from "react";

type Props = {
  count: number;
  onRetry: () => void;
};

export const InstallQueueBanner: FC<Props> = ({ count, onRetry }): ReactElement | null => {
  if (count <= 0) return null;
  return (
    <section className="flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5">
      <p className="min-w-0 flex-1 text-xs leading-4 text-foreground">
        {t("install-queue-banner", { count: String(count) })}
      </p>
      <Button size="sm" variant="subtle" onClick={onRetry}>
        {t("install-queue-retry")}
      </Button>
    </section>
  );
};
