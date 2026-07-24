import type { AutoscalePoint } from "./autoscale-chart";

/** Autoscale bounds for the demo compute. */
export const bounds = { max: 4, min: 0.25 };

/**
 * A day of compute-unit readings: idle at the floor overnight, scaling up
 * through the working day, pinned at the ceiling under peak load, then
 * settling back down.
 */
export const usage: AutoscalePoint[] = [
  { cu: 0.25, label: "00:00" },
  { cu: 0.25, label: "02:00" },
  { cu: 0.25, label: "04:00" },
  { cu: 0.4, label: "06:00" },
  { cu: 1.1, label: "08:00" },
  { cu: 2.3, label: "09:00" },
  { cu: 3.2, label: "10:00" },
  { cu: 4, label: "11:00" },
  { cu: 4, label: "12:00" },
  { cu: 3.4, label: "13:00" },
  { cu: 2.6, label: "14:00" },
  { cu: 3.1, label: "15:00" },
  { cu: 2.2, label: "16:00" },
  { cu: 1.3, label: "18:00" },
  { cu: 0.6, label: "20:00" },
  { cu: 0.25, label: "22:00" },
];
