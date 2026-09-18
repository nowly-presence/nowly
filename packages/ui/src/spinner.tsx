import * as React from "react"
import { cn } from "./utils"
import { RiLoader4Line } from "@remixicon/react"

function Spinner({ className, ...props }: React.ComponentProps<typeof RiLoader4Line>) {
  return (
    <RiLoader4Line data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
