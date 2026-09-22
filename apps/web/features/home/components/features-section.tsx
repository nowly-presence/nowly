import { SectionHeading } from "@/features/home/components/section-heading";
import { Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";

import {
  RiGlobalLine,
  RiLockLine,
  RiPuzzleLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiWindowLine,
} from "@nowly/ui/icons";
import { getTranslations } from "next-intl/server";

const icons = [RiRefreshLine, RiPuzzleLine, RiLockLine, RiShieldCheckLine, RiGlobalLine, RiWindowLine];

export const FeaturesSection = async () => {
  const t = await getTranslations("features");
  const items = t.raw("items") as Array<{ title: string; description: string }>;

  return (
    <section className="px-5 py-28 sm:px-10 sm:py-36">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <div className="mx-auto mt-12 grid max-w-[1200px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const Icon = icons[index] ?? RiPuzzleLine;
          return (
            <Card key={item.title}>
              <CardContent>
                <div className="flex size-10 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="mt-4">{item.title}</CardTitle>
                <CardDescription className="mt-2">{item.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
