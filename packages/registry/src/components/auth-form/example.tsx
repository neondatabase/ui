"use client";

import { useState } from "react";

import { NeonAurora } from "@/components/neon-aurora/neon-aurora";

import type { AuthFormValues, AuthMode } from "./auth-form";
import { AuthForm } from "./auth-form";

/**
 * The split sign-in screen: the aurora as the cover panel, the form on
 * the right. Wire the handlers to your auth layer — with Better Auth,
 * `signIn` maps to `authClient.signIn.email(values)` and `signUp` to
 * `authClient.signUp.email(values)`.
 */
export const AuthFormExample = ({
  signIn,
  signUp,
}: {
  signIn: (values: AuthFormValues) => Promise<{ error?: string }>;
  signUp: (values: AuthFormValues) => Promise<{ error?: string }>;
}) => {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: AuthFormValues) => {
    setIsBusy(true);
    setError(null);

    try {
      const action = mode === "sign-in" ? signIn : signUp;
      const result = await action(values);
      setError(result.error ?? null);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="grid min-h-[480px] overflow-hidden rounded-lg border border-border/60 lg:grid-cols-2">
      <div className="relative hidden bg-black lg:block">
        <NeonAurora className="absolute inset-0" />
      </div>
      <div className="flex items-center justify-center bg-card p-8 lg:p-12">
        <AuthForm
          error={error}
          isBusy={isBusy}
          mode={mode}
          onModeChange={(next) => {
            setMode(next);
            setError(null);
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};
