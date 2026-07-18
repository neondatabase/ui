import { AnimatedWash } from "./animated-wash";

/**
 * Shape of a compute endpoint from the Neon API
 * (`GET /projects/{id}/endpoints`); only the field the wash needs.
 */
interface NeonEndpoint {
  current_state: "init" | "active" | "idle";
}

const STATE_TINT: Record<NeonEndpoint["current_state"], string> = {
  active: "text-primary",
  idle: "text-muted-foreground",
  init: "text-primary",
};

/**
 * Give any panel a live status-colored floor: the wash reads currentColor,
 * so tinting the wrapper from the endpoint state is all the wiring needed.
 */
export const AnimatedWashExample = ({
  children,
  endpoint,
}: {
  children: React.ReactNode;
  endpoint: NeonEndpoint;
}) => (
  <div
    className={`relative isolate overflow-hidden ${STATE_TINT[endpoint.current_state]}`}
    data-wash-hover
  >
    <AnimatedWash className="-z-10 absolute inset-0" />
    <div className="text-foreground">{children}</div>
  </div>
);
