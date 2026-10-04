import { DISCORD_INVITE_URL } from "@/lib/constants";
import { ButtonAnchor, Card, CardContent, CardDescription, CardTitle, cn } from "@nowly/ui";
import { RiArrowRightUpLine, RiDiscordFill } from "@nowly/ui/icons";

type DiscordCalloutProps = {
  title: string
  description: string
  cta: string
  layout?: "stack" | "row"
  className?: string
};

// Quiet, inline invitation to the Discord: sits in the page flow next to content the visitor is already reading.
export const DiscordCallout = ({ title, description, cta, layout = "stack", className }: DiscordCalloutProps) => (
  <Card size="sm" className={className}>
    <CardContent className={cn("flex flex-col gap-4", layout === "row" && "sm:flex-row sm:items-center sm:justify-between sm:gap-6")}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/12 text-accent">
          <RiDiscordFill className="size-5" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </div>
      <ButtonAnchor
        href={DISCORD_INVITE_URL}
        rel="noreferrer"
        target="_blank"
        variant="ghost"
        className="shrink-0 self-start"
      >
        {cta}
        <RiArrowRightUpLine data-icon="inline-end" />
      </ButtonAnchor>
    </CardContent>
  </Card>
);
