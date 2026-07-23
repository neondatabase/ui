import { OperationStatus } from "@neondatabase/api-client";

import { createNeonClient } from "@/lib/neon-client";

import type { HealthSignal, HealthStatus } from "./health-card";
import { HealthCard } from "./health-card";

const FAILED = new Set<OperationStatus>([
  OperationStatus.Failed,
  OperationStatus.Error,
]);
const IN_FLIGHT = new Set<OperationStatus>([
  OperationStatus.Running,
  OperationStatus.Scheduling,
  OperationStatus.Cancelling,
]);

const plural = (count: number) => (count === 1 ? "" : "s");

/**
 * Server component: derive a project's health from its recent Neon operations.
 * Failed operations pull the rollup down, in-flight ones read as maintenance,
 * and an all-clear history is healthy. The API key stays server-side.
 */
export const HealthCardExample = async ({
  projectId,
}: {
  projectId: string;
}) => {
  const client = createNeonClient(process.env.NEON_API_KEY ?? "");

  const { data } = await client.listProjectOperations({ projectId });
  const { operations } = data;

  const failed = operations.filter((op) => FAILED.has(op.status)).length;
  const inFlight = operations.filter((op) => IN_FLIGHT.has(op.status)).length;

  let status: HealthStatus = "healthy";
  let summary = "All recent operations succeeded.";

  if (failed > 0) {
    status = "down";
    summary = `${failed} recent operation${plural(failed)} failed.`;
  } else if (inFlight > 0) {
    status = "maintenance";
    summary = `${inFlight} operation${plural(inFlight)} in progress.`;
  }

  const signals: HealthSignal[] = [
    { label: "Recent ops", value: String(operations.length) },
    {
      label: "Failed",
      status: failed > 0 ? "down" : undefined,
      value: String(failed),
    },
    {
      label: "In progress",
      status: inFlight > 0 ? "maintenance" : undefined,
      value: String(inFlight),
    },
  ];

  return (
    <HealthCard
      label="Production"
      signals={signals}
      status={status}
      summary={summary}
    />
  );
};
