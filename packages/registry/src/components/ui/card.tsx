import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Card = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn(
      "flex flex-col gap-6 rounded-xl border border-border bg-surface-raised py-6 text-text shadow-sm",
      className
    )}
    data-slot="card"
    {...props}
  />
);

const CardHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("flex flex-col gap-1.5 px-6", className)}
    data-slot="card-header"
    {...props}
  />
);

const CardTitle = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("font-semibold leading-none", className)}
    data-slot="card-title"
    {...props}
  />
);

const CardDescription = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("text-sm text-text-muted", className)}
    data-slot="card-description"
    {...props}
  />
);

const CardContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("px-6", className)} data-slot="card-content" {...props} />
);

const CardFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("flex items-center px-6", className)}
    data-slot="card-footer"
    {...props}
  />
);

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
