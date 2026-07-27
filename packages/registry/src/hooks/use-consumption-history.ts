"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ConsumptionBucket,
  ConsumptionGranularity,
  ConsumptionMetricName,
  ConsumptionPeriod,
  ConsumptionTotals,
} from "@/lib/consumption";
import {
  CONSUMPTION_METRICS,
  flattenConsumption,
  sumBuckets,
} from "@/lib/consumption";

/**
 * Neon refreshes consumption roughly every 15 minutes and the endpoints
 * share a ~50 req/min bucket, so anything faster than this just burns
 * quota on numbers that haven't moved.
 */
export const MIN_POLL_INTERVAL_MS = 900_000;

export interface UseConsumptionHistoryOptions {
  /**
   * Your own route handler that proxies the Neon consumption API. The key
   * is server-only, so the browser must never call console.neon.tech
   * directly. Defaults to "/api/consumption".
   */
  endpoint?: string;
  /** RFC 3339 start of the window. */
  from: string;
  /** RFC 3339 end of the window. */
  to: string;
  granularity: ConsumptionGranularity;
  /** Defaults to every metric the v2 project endpoint returns. */
  metrics?: readonly ConsumptionMetricName[];
  /** Narrow to specific projects; omit for the whole org. */
  projectIds?: readonly string[];
  /** Re-fetch on an interval. Clamped to 15 minutes. */
  pollIntervalMs?: number;
  /** Set false to hold the request until you're ready. */
  enabled?: boolean;
}

export interface UseConsumptionHistoryResult {
  /** One entry per timeframe, oldest first, raw API units. */
  buckets: ConsumptionBucket[];
  /** Every metric summed across the window, raw API units. */
  totals: ConsumptionTotals;
  /** The untouched response, for per-project or per-branch splitting. */
  periods: ConsumptionPeriod[];
  isLoading: boolean;
  error: string | null;
  /** Fetched-at timestamp; pair it with a metering-lag notice. */
  updatedAt: Date | null;
  refresh: () => void;
}

interface ConsumptionResponse {
  projects?: { project_id: string; periods: ConsumptionPeriod[] }[];
  branches?: { branch_id: string; periods: ConsumptionPeriod[] }[];
}

const buildQuery = (options: UseConsumptionHistoryOptions) => {
  const params = new URLSearchParams({
    from: options.from,
    granularity: options.granularity,
    metrics: (options.metrics ?? CONSUMPTION_METRICS).join(","),
    to: options.to,
  });

  if (options.projectIds?.length) {
    params.set("project_ids", options.projectIds.join(","));
  }

  return params.toString();
};

/** Both v2 shapes nest the same periods; take whichever key came back. */
const readPeriods = (payload: ConsumptionResponse): ConsumptionPeriod[] => {
  const holders = payload.projects ?? payload.branches ?? [];

  return holders.flatMap((holder) => holder.periods);
};

/**
 * Fetches consumption history through your own proxy route and shapes it
 * for charts and cards: flat buckets, summed totals, and the raw periods.
 *
 * The values stay in raw API units (CU-seconds, byte-hours, branch-hours).
 * Convert at the display edge with `toBillingUnit` and friends so the same
 * numbers can feed a chart, a breakdown, and a cost estimate.
 */
export const useConsumptionHistory = (
  options: UseConsumptionHistoryOptions
): UseConsumptionHistoryResult => {
  const {
    enabled = true,
    endpoint = "/api/consumption",
    pollIntervalMs,
  } = options;

  /**
   * One state object, tagged with the request it answers. Loading is
   * derived from that tag rather than set at the top of the effect: no
   * render cascade, and no window where stale data shows without a
   * pending state on refetch.
   */
  const [settled, setSettled] = useState<{
    key: string;
    periods: ConsumptionPeriod[];
    error: string | null;
    updatedAt: Date;
  } | null>(null);
  const [nonce, setNonce] = useState(0);

  const query = buildQuery(options);
  const requestKey = `${endpoint}?${query}#${nonce}`;
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const load = async () => {
      try {
        const response = await fetch(`${endpoint}?${query}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Consumption request failed (${response.status})`);
        }

        const payload = (await response.json()) as ConsumptionResponse;

        setSettled({
          error: null,
          key: requestKey,
          periods: readPeriods(payload),
          updatedAt: new Date(),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        // Keep the last good numbers on screen; the error line says why
        // they stopped moving.
        setSettled((previous) => ({
          error: error instanceof Error ? error.message : "Request failed",
          key: requestKey,
          periods: previous?.periods ?? [],
          updatedAt: new Date(),
        }));
      }
    };

    void load();

    const interval =
      pollIntervalMs === undefined
        ? null
        : window.setInterval(
            () => void load(),
            Math.max(pollIntervalMs, MIN_POLL_INTERVAL_MS)
          );

    return () => {
      controller.abort();

      if (interval !== null) {
        window.clearInterval(interval);
      }
    };
  }, [enabled, endpoint, query, pollIntervalMs, requestKey]);

  const periods = settled?.periods ?? [];
  const buckets = flattenConsumption(periods);

  return {
    buckets,
    error: settled?.error ?? null,
    isLoading: enabled && settled?.key !== requestKey,
    periods,
    refresh,
    totals: sumBuckets(buckets),
    updatedAt: settled?.updatedAt ?? null,
  };
};
