"use client";

import { LogsViewer } from "./logs-viewer";
import { useLogsStream } from "./use-logs-stream";

export const LogsViewerExample = () => {
  const { error, isStreaming, lines } = useLogsStream({
    endpoint: "/api/logs/stream?branch=br-main&compute=compute-0",
  });

  return (
    <LogsViewer
      error={error}
      isStreaming={isStreaming}
      lines={lines}
      title="Compute logs"
    />
  );
};
