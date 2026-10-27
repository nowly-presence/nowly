import { cn } from "@/ui/cn";
import { type HTMLAttributes } from "react";

type GroupProps = HTMLAttributes<HTMLDivElement> & {
  hideSeparator?: boolean;
};

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-sm border border-line bg-surface", className)} {...props} />
);

export const Group = ({ className, hideSeparator = false, ...props }: GroupProps) => (
  <Card className={cn(hideSeparator ? "divide-y-0 overflow-hidden" : "divide-y divide-line overflow-hidden", className)} {...props} />
);