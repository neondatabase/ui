"use client";

import { useState } from "react";

import { AppCreator } from "./app-creator";
import { samplePrompts } from "./fixtures";

export const AppCreatorDemo = () => {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <AppCreator
        isCreating={creating}
        placeholderPrompts={samplePrompts}
        onCreate={(prompt, plan) => {
          setCreating(true);
          setCreated(null);
          window.setTimeout(() => {
            setCreating(false);
            setCreated(`${plan}: ${prompt}`);
          }, 1800);
        }}
      />
      {created ? (
        <p className="font-mono text-muted-foreground text-xs">
          created {created}
        </p>
      ) : null}
    </div>
  );
};

export default AppCreatorDemo;
