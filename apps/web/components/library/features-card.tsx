"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { getLocalizedFeatures } from "@/lib/data/localized";
import type { Presence } from "@/lib/data/presences";
import { IconCircleCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  platform: Presence
  locale: string
};

export const FeaturesCard: FC<Props> = ({ platform, locale }): ReactElement => {
  const t = useTranslations("marketplace-detail");

  return (
    <Card>
      <CardTitle>{t("features")}</CardTitle>
      <ul className="space-y-3">
        {getLocalizedFeatures(platform, locale).map((feature, index) => (
          <li key={index} className="flex items-center gap-3 text-muted-foreground">
            <IconCircleCheck className="w-5 h-5 shrink-0" color={platform.iconColor} />
            {feature}
          </li>
        ))}
      </ul>
    </Card>
  );
};