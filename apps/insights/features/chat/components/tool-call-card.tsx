import { Card, CardContent } from "@nowly/ui";
import { RiLoader4Line } from "@nowly/ui/icons";

const toolLabels: Record<string, string> = {
  listCatalog: "Looking up the analytics catalog",
  getOverviewTotals: "Fetching overview totals",
  getMetricSeries: "Fetching metric series",
  getFunnel: "Fetching funnel data",
};

export const ToolCallCard = ({ toolName, state }: { toolName: string; state: string }) => {
  const label = toolLabels[toolName] ?? `Running ${toolName}`;
  const pending = state !== "output-available" && state !== "output-error";

  return (
    <Card className="w-fit">
      <CardContent className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        {pending ? <RiLoader4Line className="size-3.5 animate-spin" /> : null}
        {label}
      </CardContent>
    </Card>
  );
};
