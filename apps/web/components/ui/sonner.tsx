"use client";

import { IconCircleCheck, IconInfoCircle, IconLoader2, IconCircleX, IconAlertTriangle } from "@tabler/icons-react";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <IconCircleCheck className="size-4" />,
        info: <IconInfoCircle className="size-4" />,
        warning: <IconAlertTriangle className="size-4" />,
        error: <IconCircleX className="size-4" />,
        loading: <IconLoader2 className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "var(--background)",
          "--normal-border": "rgba(255, 255, 255, 0.12)",

          "--success-bg": "var(--foreground)",
          "--success-text": "var(--background)",
          "--success-border": "rgba(255, 255, 255, 0.12)",

          "--info-bg": "var(--foreground)",
          "--info-text": "var(--background)",
          "--info-border": "rgba(255, 255, 255, 0.12)",

          "--warning-bg": "var(--foreground)",
          "--warning-text": "var(--background)",
          "--warning-border": "rgba(255, 255, 255, 0.12)",

          "--error-bg": "var(--destructive)",
          "--error-text": "var(--foreground)",
          "--error-border": "rgba(239, 68, 68, 0.35)",

          "--border-radius": "12px",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-medium shadow-[0_16px_40px_rgba(0,0,0,0.35)]",
          description: "opacity-70",
          actionButton: "bg-background text-foreground",
          cancelButton: "bg-background/10 text-current",
          closeButton: "bg-transparent text-current",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

