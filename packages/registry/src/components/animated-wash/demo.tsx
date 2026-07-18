import { cn } from "@/lib/utils";

import { AnimatedWash } from "./animated-wash";
import { washTints } from "./fixtures";

export const AnimatedWashDemo = () => (
  <div className="grid w-full max-w-lg gap-3 sm:grid-cols-3">
    {washTints.map((wash) => (
      <div
        className={cn(
          "relative isolate h-32 overflow-hidden border border-border/60 bg-card transition-colors hover:border-border",
          wash.tint
        )}
        data-wash-hover
        key={wash.label}
      >
        <AnimatedWash className="absolute inset-0" />
        <span className="absolute top-2 left-2 font-mono text-[10px] text-muted-foreground">
          {wash.label}
        </span>
      </div>
    ))}
  </div>
);

export default AnimatedWashDemo;
