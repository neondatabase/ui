"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RegionPingResult = number | null;

export type RegionPingStatus = "idle" | "measuring" | "done";

export interface UseRegionPingOptions {
  /** Timed requests per region after the warmup; the best time wins. */
  samples?: number;
  /** Set false to defer measuring, then call refresh() when ready. */
  enabled?: boolean;
}

const DEFAULT_SAMPLES = 3;

/** One opaque round-trip to the endpoint; null when unreachable. */
const timeRequest = async (url: string): Promise<RegionPingResult> => {
  try {
    const start = performance.now();

    await fetch(url, {
      cache: "no-store",
      method: "HEAD",
      mode: "no-cors",
    });

    return Math.round(performance.now() - start);
  } catch {
    return null;
  }
};

const measureRegion = async (
  url: string,
  samples: number
): Promise<RegionPingResult> => {
  // Warmup request pays DNS + TLS so samples measure the wire.
  await timeRequest(url);

  let best: RegionPingResult = null;

  for (let index = 0; index < samples; index += 1) {
    // Sequential on purpose: parallel samples contend for the socket.
    // eslint-disable-next-line no-await-in-loop
    const sample = await timeRequest(url);

    if (sample !== null && (best === null || sample < best)) {
      best = sample;
    }
  }

  return best;
};

/**
 * Measures round-trip latency from the browser to each region
 * endpoint. Endpoints must tolerate opaque no-cors HEAD requests
 * (any reachable URL works; the response is never read).
 */
export const useRegionPing = (
  urls: Record<string, string>,
  { enabled = true, samples = DEFAULT_SAMPLES }: UseRegionPingOptions = {}
) => {
  const [pings, setPings] = useState<Record<string, RegionPingResult>>({});
  const [status, setStatus] = useState<RegionPingStatus>("idle");
  const urlsRef = useRef(urls);

  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);

  const refresh = useCallback(async () => {
    setStatus("measuring");

    const entries = Object.entries(urlsRef.current);

    await Promise.all(
      entries.map(async ([id, url]) => {
        const ping = await measureRegion(url, samples);
        setPings((current) => ({ ...current, [id]: ping }));
      })
    );

    setStatus("done");
  }, [samples]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Deferred a frame so the initial "measuring" state doesn't
    // set state synchronously inside the effect body.
    const frame = requestAnimationFrame(() => {
      void refresh();
    });

    return () => cancelAnimationFrame(frame);
  }, [enabled, refresh]);

  return { pings, refresh, status };
};
