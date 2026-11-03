"use client";

import { RiVerifiedBadgeFill } from "@nowly/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@nowly/ui";

export const VerifiedBadge = ({ label }: { label: string }) => (
  <Tooltip>
    <TooltipTrigger render={<span role="img" aria-label={label} className="inline-flex shrink-0 cursor-default" />}>
      <RiVerifiedBadgeFill className="size-6 text-accent" />
    </TooltipTrigger>
    <TooltipContent side="right">{label}</TooltipContent>
  </Tooltip>
);