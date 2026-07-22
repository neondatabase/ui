"use client";

import { useState } from "react";

import { sampleErrorDetail, sampleSrc, sampleUrl } from "./fixtures";
import type { PreviewFrameState } from "./preview-frame";
import { PreviewFrame } from "./preview-frame";

const STATES: PreviewFrameState[] = ["ready", "sleeping", "waking", "error"];

export const PreviewFrameDemo = () => {
  const [state, setState] = useState<PreviewFrameState>("ready");

  const restart = () => {
    setState("waking");
    window.setTimeout(() => setState("ready"), 2000);
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <PreviewFrame
        className="h-80"
        displaySrc={sampleUrl}
        errorDetail={sampleErrorDetail}
        onRestart={restart}
        onWake={restart}
        src={sampleSrc}
        state={state}
        title="acme-crm preview"
      />
      <div className="flex gap-1.5">
        {STATES.map((option) => (
          <button
            className={
              option === state
                ? "rounded-sm border border-primary/60 px-2.5 py-1 font-mono text-foreground text-xs"
                : "rounded-sm border border-border/60 px-2.5 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
            }
            key={option}
            onClick={() => setState(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PreviewFrameDemo;
