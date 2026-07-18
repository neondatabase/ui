"use client";

import { useState } from "react";

import type { AuthFieldName, AuthMode } from "./auth-form";
import { AuthForm } from "./auth-form";
import { sampleFieldErrors, sampleProviders } from "./fixtures";

export const AuthFormDemo = () => {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isBusy, setIsBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AuthFieldName, string>> | undefined
  >();

  return (
    <AuthForm
      fieldErrors={fieldErrors}
      isBusy={isBusy}
      mode={mode}
      onForgotPassword={() => setFieldErrors(undefined)}
      onModeChange={(next) => {
        setMode(next);
        setFieldErrors(undefined);
      }}
      onProvider={() => setFieldErrors(undefined)}
      onSubmit={() => {
        setIsBusy(true);
        setFieldErrors(undefined);
        window.setTimeout(() => {
          setIsBusy(false);
          setFieldErrors(sampleFieldErrors);
        }, 1500);
      }}
      providers={sampleProviders}
    />
  );
};

export default AuthFormDemo;
