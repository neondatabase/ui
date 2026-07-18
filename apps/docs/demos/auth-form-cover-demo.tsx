"use client";

import type {
  AuthFormValues,
  AuthMode,
} from "@neon-ui/registry/components/auth-form/auth-form";
import { AuthForm } from "@neon-ui/registry/components/auth-form/auth-form";
import { NeonAurora } from "@neon-ui/registry/components/neon-aurora/neon-aurora";
import { useState } from "react";

/** The split sign-in screen: the aurora as the cover, the form beside it. */
export default function AuthFormCoverDemo() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = (_values: AuthFormValues) => {
    setIsBusy(true);
    window.setTimeout(() => setIsBusy(false), 1500);
  };

  return (
    <div className="grid w-full overflow-hidden rounded-lg border border-border/60 lg:grid-cols-2">
      <div className="relative hidden min-h-[360px] bg-black lg:block">
        <NeonAurora className="absolute inset-0" />
      </div>
      <div className="flex items-center justify-center bg-background p-6 lg:p-8">
        <AuthForm
          isBusy={isBusy}
          mode={mode}
          onModeChange={setMode}
          onSubmit={handleSubmit}
          variant="bare"
        />
      </div>
    </div>
  );
}
