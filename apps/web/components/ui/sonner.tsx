"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { RiCheckboxCircleLine, RiInformationLine, RiAlertLine, RiCloseCircleLine, RiLoader4Line } from "@remixicon/react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: (
          <RiCheckboxCircleLine className="size-4" />
        ),
        info: (
          <RiInformationLine className="size-4" />
        ),
        warning: (
          <RiAlertLine className="size-4" />
        ),
        error: (
          <RiCloseCircleLine className="size-4" />
        ),
        loading: (
          <RiLoader4Line className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
