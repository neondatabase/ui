"use client";

import { useEffect, useState } from "react";

import { logsViewerLines, logsViewerStreamLine } from "./fixtures";
import { LogsViewer } from "./logs-viewer";
import type { LogLine } from "./logs-viewer";

export const LogsViewerDemo = () => {
  const [lines, setLines] = useState<LogLine[]>(logsViewerLines);
  const [streaming, setStreaming] = useState(true);

  useEffect(() => {
    if (!streaming) {
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setLines((current) => [...current, logsViewerStreamLine(index)]);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [streaming]);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <button
        aria-pressed={streaming}
        className="self-start rounded-md border border-input px-2.5 py-1 font-medium text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={() => setStreaming((current) => !current)}
        type="button"
      >
        {streaming ? "Pause stream" : "Resume stream"}
      </button>
      <LogsViewer isStreaming={streaming} lines={lines} title="Compute logs" />
    </div>
  );
};

export default LogsViewerDemo;
