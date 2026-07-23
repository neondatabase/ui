import { EndpointState } from "@neondatabase/api-client";

import { createNeonClient } from "@/lib/neon-client";

import type { ComputeState } from "./compute-status";
import { ComputeStatus } from "./compute-status";

const MINUTE_S = 60;

/** Neon exposes init/active/idle; map them onto the compute vocabulary. */
const toComputeState = (
  current: EndpointState,
  pending?: EndpointState
): ComputeState => {
  if (current === EndpointState.Init || pending === EndpointState.Active) {
    return "scaling";
  }
  if (current === EndpointState.Idle) {
    return "suspended";
  }

  return "active";
};

const scaleToZeroReadout = (state: ComputeState, suspendSeconds: number) => {
  if (state === "suspended") {
    return "scaled to zero";
  }
  if (suspendSeconds <= 0) {
    return "scale to zero off";
  }

  return `scales to zero after ${Math.round(suspendSeconds / MINUTE_S)}m`;
};

/**
 * Server component: read a branch's read-write compute endpoint and render its
 * live state, autoscaling range, and scale-to-zero setting. The API key stays
 * server-side.
 */
export const ComputeStatusExample = async ({
  projectId,
  branchId,
}: {
  projectId: string;
  branchId: string;
}) => {
  const client = createNeonClient(process.env.NEON_API_KEY ?? "");

  const { data } = await client.listProjectBranchEndpoints(projectId, branchId);
  const endpoint = data.endpoints.find((item) => item.type === "read_write");

  if (!endpoint) {
    return <ComputeStatus state="suspended" />;
  }

  const state = toComputeState(endpoint.current_state, endpoint.pending_state);

  return (
    <ComputeStatus
      cu={[
        endpoint.autoscaling_limit_min_cu,
        endpoint.autoscaling_limit_max_cu,
      ]}
      scaleToZero={scaleToZeroReadout(state, endpoint.suspend_timeout_seconds)}
      state={state}
    />
  );
};
