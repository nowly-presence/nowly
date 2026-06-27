"use client";

import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  error: Error & { digest?: string }
  reset: () => void
};

const Error: FC<Props> = ({ reset }): ReactElement => {
  const t = useTranslations("error-page");

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="mb-8">
          <IconAlertCircle className="mx-auto h-12 w-12 text-destructive" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("title")}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">{t("description")}</p>

        <Button onClick={reset} variant="primary" size="md">
          <IconRefresh className="w-4 h-4" />
          {t("retry")}
        </Button>
      </div>
    </div>
  );
};

export default Error;