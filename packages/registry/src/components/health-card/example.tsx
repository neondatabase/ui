import type { OperationStatus } from "@neon/sdk";

import { createNeonClient } from "@/lib/neon-client";

import type { HealthSignal, HealthStatus } from "./health-card";
import { HealthCard } from "./health-card";

const FAILED = new Set<OperationStatus>(["failed", "error"]);
const IN_FLIGHT = new Set<OperationStatus>([
  "running",
  "scheduling",
  "cancelling",
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
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");

  const { data } = await neon.operations.list(projectId).page();
  const operations = data?.items ?? [];

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
