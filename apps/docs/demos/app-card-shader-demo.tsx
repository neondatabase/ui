"use client";

import { AnimatedWash } from "@neon-ui/registry/components/animated-wash/animated-wash";
import { AppCard } from "@neon-ui/registry/components/app-card/app-card";

/**
 * The wash slot accepts any ReactNode. AnimatedWash is the registry's own
 * WebGL grain gradient (adapted from paper-design/shaders): it reads
 * currentColor from the status-tinted slot, so the same vocabulary that
 * colors the static CSS wash colors the animated one.
 */
export default function AppCardShaderDemo() {
  return (
    <div className="w-full max-w-sm">
      <AppCard
        description="Track your reading list with an add-book form and read/unread toggles."
        href="#"
        name="book-tracker"
        onClick={(event) => event.preventDefault()}
        plan="paid"
        status="ready"
        updatedAt="2h ago"
        wash={<AnimatedWash />}
      />
    </div>
  );
}
