import { ComputeStatus } from "./compute-status";
import { computeActive } from "./fixtures";

export const ComputeStatusDemo = () => (
  <ComputeStatus variant="panel" {...computeActive} />
);

export default ComputeStatusDemo;
