import { ComputeStatus } from "@neon-ui/registry/components/compute-status/compute-status";
import {
  computeActive,
  computeIdle,
  computeScaling,
  computeSuspended,
} from "@neon-ui/registry/components/compute-status/fixtures";

const stateVariants = [
  computeActive,
  computeScaling,
  computeIdle,
  computeSuspended,
];

export default function ComputeStatusStateVariants() {
  return (
    <div className="flex flex-col items-start gap-2">
      {stateVariants.map((compute) => (
        <ComputeStatus key={compute.state} variant="panel" {...compute} />
      ))}
    </div>
  );
}
