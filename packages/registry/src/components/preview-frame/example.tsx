"use client";

import { useEffect, useRef, useState } from "react";

import type { PreviewFrameState } from "./preview-frame";
import { PreviewFrame } from "./preview-frame";

/**
 * The workspace wiring: the sandbox reports its lifecycle over your API,
 * the agent bumps reloadSignal after each applied edit, and restart posts
 * back to the control plane.
 */
export const PreviewFrameExample = () => {
  const [state, setState] = useState<PreviewFrameState>("waking");
  const [reloadSignal, setReloadSignal] = useState(0);
  const wakeTimer = useRef<number>(0);

  useEffect(() => {
    // Stand-in for polling GET /apps/:id/sandbox until it reports ready.
    wakeTimer.current = window.setTimeout(() => setState("ready"), 2500);
    return () => window.clearTimeout(wakeTimer.current);
  }, []);

  const handleRestart = () => {
    // POST /apps/:id/sandbox/restart, then poll again.
    setState("waking");
    window.clearTimeout(wakeTimer.current);
    wakeTimer.current = window.setTimeout(() => setState("ready"), 2500);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <PreviewFrame
        className="h-96 w-full"
        onRestart={handleRestart}
        reloadSignal={reloadSignal}
        src="https://sandbox-8f2k.fly.dev"
        state={state}
        title="Live app preview"
      />
      <button
        className="self-start border border-border/60 px-2.5 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
        onClick={() => setReloadSignal((signal) => signal + 1)}
        type="button"
      >
        simulate agent edit
      </button>
    </div>
  );
};
