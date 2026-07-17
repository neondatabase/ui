import { StatusBadge } from "./status-badge";
import type { AppStatus } from "./status-badge";

/**
 * Shape of a compute endpoint from the Neon API
 * (`GET /projects/{id}/endpoints`); only the fields the badge needs.
 */
interface NeonEndpoint {
  current_state: "init" | "active" | "idle";
  pending_state?: "init" | "active" | "idle";
  last_active?: string;
}

/** Map a Neon compute endpoint's state onto the shared status vocabulary. */
const endpointStatus = (endpoint: NeonEndpoint): AppStatus => {
  if (endpoint.pending_state) {
    return "provisioning";
  }

  switch (endpoint.current_state) {
    case "active": {
      return "ready";
    }
    case "init": {
      return "provisioning";
    }
    default: {
      return "stopped";
    }
  }
};

/** Render the live status of a Neon compute endpoint. */
export const StatusBadgeExample = ({
  endpoint,
}: {
  endpoint: NeonEndpoint;
}) => <StatusBadge status={endpointStatus(endpoint)} />;
