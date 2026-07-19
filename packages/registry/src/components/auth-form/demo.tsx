"use client";

import { useState } from "react";

import type { AuthFieldName, AuthFormValues, AuthMode } from "./auth-form";
import { AuthForm } from "./auth-form";
import { sampleFieldErrors, sampleProviders } from "./fixtures";

const FLIGHT_MS = 1500;

export const AuthFormDemo = () => {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [isBusy, setIsBusy] = useState(false);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AuthFieldName, string>> | undefined
  >();

  const changeMode = (next: AuthMode) => {
    setMode(next);
    setFieldErrors(undefined);
    setResetSentTo(null);
  };

  const handleSubmit = (values: AuthFormValues) => {
    setIsBusy(true);
    setFieldErrors(undefined);
    window.setTimeout(() => {
      setIsBusy(false);

      if (mode === "reset") {
        setResetSentTo(values.email);
        return;
      }

      setFieldErrors(sampleFieldErrors);
    }, FLIGHT_MS);
  };

  return (
    <AuthForm
      fieldErrors={fieldErrors}
      isBusy={isBusy}
      mode={mode}
      onForgotPassword={() => changeMode("reset")}
      onModeChange={changeMode}
      onProvider={() => setFieldErrors(undefined)}
      onResend={() => setResetSentTo(null)}
      onSubmit={handleSubmit}
      providers={sampleProviders}
      resetSentTo={resetSentTo}
    />
  );
};

export default AuthFormDemo;
