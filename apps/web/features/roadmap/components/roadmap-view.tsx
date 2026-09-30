import { ButtonLink } from "@/components/button-link";
import { Card, CardContent, CardDescription, CardTitle } from "@nowly/ui/card";
import { cn } from "@nowly/ui/utils";
import { getTranslations } from "next-intl/server";

type RoadmapItem = {
  title: string
  description: string
};

type RoadmapColumn = {
  status: string
  title: string
  description: string
  items: RoadmapItem[]
};

const columnAccents = [
  "border-accent/35 bg-accent/6",
  "border-foreground/12 bg-foreground/[0.03]",
  "border-foreground/8 bg-foreground/[0.02]",
];

export const RoadmapView = async () => {
  const t = await getTranslations("roadmapPage");
  const columns = t.raw("columns") as RoadmapColumn[];

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <header className="max-w-2xl">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description")}
          </p>
        </header>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {columns.map((column, index) => (
            <section
              key={column.title}
              className={cn(
                "rounded-[16px] border p-5 sm:p-6",
                columnAccents[index] ?? columnAccents[columnAccents.length - 1],
              )}
            >
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{column.status}</p>
              <h2 className="mt-3 text-xl font-medium text-foreground">{column.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{column.description}</p>

              <div className="mt-6 grid gap-3">
                {column.items.map((item) => (
                  <Card key={item.title} size="sm" className="bg-background/55">
                    <CardContent>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription className="mt-2">{item.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 rounded-[16px] bg-foreground/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("note")}</p>
          <ButtonLink href="/support" variant="inverted" className="shrink-0">
            {t("feedback")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
};
