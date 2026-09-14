import * as React from "react";

import { cn } from "@/lib/utils";

function Card({
  className,
  size = "default",
  variant = "default",
  bannerUrl,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm";
  variant?: "default" | "muted";
  bannerUrl?: string;
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      data-has-banner={!!bannerUrl}
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-2xl border text-sm text-card-foreground shadow-sm transition-colors",
        "data-[variant=default]:border-border/80 data-[variant=default]:bg-card",
        "data-[variant=muted]:border-border/60 data-[variant=muted]:bg-muted/30",
        "data-[size=default]:[--card-spacing:--spacing(6)]",
        "data-[size=sm]:[--card-spacing:--spacing(5)]",
        className
      )}
      {...props}
    >
      {bannerUrl ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 overflow-hidden">
          <img
            src={bannerUrl}
            alt=""
            aria-hidden="true"
            className="size-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-card/75 to-card" />
        </div>
      ) : null}

      <div
        data-slot="card-inner"
        className={cn(
          "relative z-10 flex flex-col gap-(--card-spacing)",
          "p-(--card-spacing)",
          "group-data-[has-banner=true]/card:pt-28",
          "group-data-[size=sm]/card:group-data-[has-banner=true]/card:pt-24"
        )}
      >
        {props.children}
      </div>
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-lg font-semibold leading-snug tracking-tight text-foreground",
        "group-data-[size=sm]/card:text-base",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("space-y-4", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
};

