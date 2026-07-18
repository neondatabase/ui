import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-[neon-skeleton-pulse_2.8s_cubic-bezier(0.4,0,0.2,1)_infinite] rounded-md bg-muted will-change-[opacity] motion-reduce:animate-none motion-reduce:opacity-80",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
