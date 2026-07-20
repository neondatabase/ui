import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- primitive; consumers pass htmlFor or nest a control
    <label
      data-slot="label"
      className={cn(
        "flex select-none items-center gap-2 font-medium text-foreground text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
