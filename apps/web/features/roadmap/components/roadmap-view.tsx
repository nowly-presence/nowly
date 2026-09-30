import { Fragment } from "react";

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
  completed?: boolean
  items: RoadmapItem[]
};

export const RoadmapView = async () => {
  const t = await getTranslations("roadmapPage");
  const columns = t.raw("columns") as RoadmapColumn[];
  const firstCompletedIndex = columns.findIndex((column) => column.completed === true);

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

        <div className="relative mt-14 max-w-4xl">
          <div className="grid gap-12">
            {columns.map((column, index) => {
              const nextColumn = columns[index + 1];
              const isCompleted = column.completed === true;
              const nextIsCompleted = nextColumn?.completed === true;

              return (
                <Fragment key={column.title}>
                  {index === firstCompletedIndex ? (
                    <div className="-mb-5 flex items-center gap-3 pl-9 sm:pl-14">
                      <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        {t("history")}
                      </span>
                      <span className="h-px flex-1 bg-border" aria-hidden />
                    </div>
                  ) : null}
                  <section className="relative pl-9 sm:pl-14">
                    {nextColumn ? (
                      <div
                        className={cn(
                          "absolute top-4 bottom-[-3rem] left-[11px] w-px sm:left-[15px]",
                          isCompleted && nextIsCompleted ? "bg-accent" : "bg-border",
                        )}
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={cn(
                        "absolute top-1 left-0 z-10 flex size-6 items-center justify-center rounded-full border-4 border-background sm:size-8",
                        isCompleted ? "bg-accent" : "bg-foreground/35",
                      )}
                      aria-hidden
                    >
                      <span className="size-1.5 rounded-full bg-background sm:size-2" />
                    </span>

                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">{column.status}</p>
                      <h2 className="text-2xl font-medium tracking-tight text-foreground">{column.title}</h2>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{column.description}</p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {column.items.map((item) => (
                        <Card key={item.title} size="sm" className="bg-foreground/[0.035]">
                          <CardContent>
                            <CardTitle>{item.title}</CardTitle>
                            <CardDescription className="mt-2">{item.description}</CardDescription>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                </Fragment>
              );
            })}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start gap-4 rounded-[16px] bg-foreground/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("note")}</p>
          <ButtonLink href="/support" variant="inverted" className="shrink-0">
            {t("feedback")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
};

