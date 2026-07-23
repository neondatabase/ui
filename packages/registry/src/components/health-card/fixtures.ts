import type { HealthCardProps } from "./health-card";

/** All green: the rollup names itself and the signals stay uncolored. */
export const healthHealthy: HealthCardProps = {
  label: "Production",
  signals: [
    { label: "Latency p99", value: "42 ms" },
    { label: "Error rate", value: "0.01%" },
    { label: "Uptime 30d", value: "99.99%" },
    { label: "Compute", value: "active" },
  ],
  status: "healthy",
  summary: "All systems operational.",
  updatedAt: "checked 12s ago",
};

/** One signal carries the amber; it is the reason the rollup is not green. */
export const healthDegraded: HealthCardProps = {
  label: "Production",
  signals: [
    { label: "Latency p99", status: "degraded", value: "318 ms" },
    { label: "Error rate", value: "0.4%" },
    { label: "Uptime 30d", value: "99.94%" },
    { label: "Compute", value: "scaling" },
  ],
  status: "degraded",
  summary: "Elevated latency in aws-us-east-2.",
  updatedAt: "checked 8s ago",
};

/** Down: the failing signal wears destructive, the rest hold their last read. */
export const healthDown: HealthCardProps = {
  label: "Production",
  signals: [
    { label: "Latency p99", value: "—" },
    { label: "Error rate", status: "down", value: "37%" },
    { label: "Uptime 30d", value: "99.61%" },
    { label: "Compute", status: "down", value: "unreachable" },
  ],
  status: "down",
  summary: "Database unreachable; connections failing.",
  updatedAt: "checked 3s ago",
};

export const healthCards: HealthCardProps[] = [
  healthHealthy,
  healthDegraded,
  healthDown,
];
