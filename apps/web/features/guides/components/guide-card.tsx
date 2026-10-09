import type { Guide } from "@/features/guides/lib/guides";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardTitle } from "@nowly/ui";
import { RiArrowRightLine } from "@nowly/ui/icons";

export const GuideCard = ({ guide, minutesLabel, categoryLabel }: { guide: Guide; minutesLabel: string; categoryLabel?: string }) => (
  <Link href={`/guides/${guide.slug}`} className="group block h-full rounded-[16px] outline-offset-4">
    <Card className="h-full transition-colors group-hover:bg-foreground/6">
      <CardContent className="flex h-full flex-col">
        {categoryLabel ? (
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent">{categoryLabel}</p>
        ) : null}
        <CardTitle className="mt-2 text-lg leading-snug">{guide.title}</CardTitle>
        <CardDescription className="mt-2 flex-1">{guide.description}</CardDescription>
        <p className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
          <span>{minutesLabel}</span>
          <RiArrowRightLine className="size-4 text-accent transition-transform group-hover:translate-x-0.5" />
        </p>
      </CardContent>
    </Card>
  </Link>
);
