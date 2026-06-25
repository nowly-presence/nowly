import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { FC, ReactElement } from "react";

type DownloadOption = {
  label: string;
  url: string;
};

type PlatformConfig = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  downloads: DownloadOption[];
};

type Props = {
  config: PlatformConfig;
  layout?: "stack" | "inline";
};

export const HostDownload: FC<Props> = ({ config, layout = "stack" }): ReactElement => {
  return (
    <div className={cn(
      "flex gap-2",
      layout === "inline"
        ? "flex-col"
        : "flex-col items-center"
    )}>
      {config.downloads.map((dl, i) => (
        <Link
          key={dl.url}
          href={dl.url}
          download
          className={buttonVariants({
            variant: i === 0 ? "accent" : "secondary",
            size: "sm",
            class: layout === "inline" ? "w-full sm:w-auto" : "w-full max-w-sm",
          })}
        >
          {dl.label}
        </Link>
      ))}
    </div>
  );
};
