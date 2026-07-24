"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LogLine } from "./logs-viewer";

export interface UseLogsStreamOptions {
  endpoint?: string;
  maxLines?: number;
  enabled?: boolean;
}

/**
 * Reads a server-sent events endpoint that emits one JSON log line per message.
 * The server owns retention and authorization; this hook only keeps the tail.
 */
export const useLogsStream = ({
  endpoint = "/api/logs/stream",
  maxLines = 5000,
  enabled = true,
}: UseLogsStreamOptions = {}) => {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<Error | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const clear = useCallback(() => setLines([]), []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const source = new EventSource(endpoint);
    sourceRef.current = source;

    const handleOpen = () => {
      setIsStreaming(true);
      setStreamError(null);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const line = JSON.parse(event.data) as LogLine;
        setLines((current) => {
          const next = [...current, line];
          return next.length > maxLines ? next.slice(-maxLines) : next;
        });
      } catch {
        setStreamError(new Error("Received a malformed log line."));
      }
    };

    const handleError = () => {
      setIsStreaming(false);
      setStreamError(new Error("Log stream disconnected."));
    };

    source.addEventListener("open", handleOpen);
    source.addEventListener("message", handleMessage);
    source.addEventListener("error", handleError);

    return () => {
      source.removeEventListener("open", handleOpen);
      source.removeEventListener("message", handleMessage);
      source.removeEventListener("error", handleError);
      source.close();
      sourceRef.current = null;
    };
  }, [enabled, endpoint, maxLines]);

  return {
    clear,
    error: streamError,
    isStreaming,
    lines,
    setLines,
  };
};
