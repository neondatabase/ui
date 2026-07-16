import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neon/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-4 py-2",
        icon: "size-9",
        lg: "h-10 rounded-md px-6",
        sm: "h-8 rounded-md px-3 text-xs",
      },
      variant: {
        default: "bg-neon text-neon-ink hover:bg-neon-dim",
        destructive: "bg-error text-white hover:bg-error/90",
        ghost: "text-text-muted hover:bg-surface-overlay hover:text-text",
        outline:
          "border border-border bg-transparent text-text hover:bg-surface-overlay",
        secondary:
          "border border-border bg-surface-raised text-text hover:bg-surface-overlay",
      },
    },
  }
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant }))}
      data-slot="button"
      {...props}
    />
  );
};

export { Button, buttonVariants };
export type { ButtonProps };
