import type { ComputeStatusProps } from "./compute-status";

/** Serving traffic: green, breathing. */
export const computeActive: ComputeStatusProps = {
  cu: [0.25, 2],
  scaleToZero: "scales to zero after 5m",
  state: "active",
};

/** Autoscaling up under load: amber, breathing. */
export const computeScaling: ComputeStatusProps = {
  cu: [0.25, 4],
  scaleToZero: "scales to zero after 5m",
  state: "scaling",
};

/** Up but quiet, before scale-to-zero fires: steady green. */
export const computeIdle: ComputeStatusProps = {
  cu: 1,
  scaleToZero: "scales to zero in 2m",
  state: "idle",
};

/** Scaled to zero: gray, steady, the line dims. */
export const computeSuspended: ComputeStatusProps = {
  cu: [0.25, 2],
  scaleToZero: "suspended 2h ago",
  state: "suspended",
};

export const computeStates: ComputeStatusProps[] = [
  computeActive,
  computeScaling,
  computeIdle,
  computeSuspended,
];
