import type { AppPlan, AppStatus } from "./status-badge";

/** A believable dashboard row: app name, status, plan. */
export const dashboardApps: {
  name: string;
  plan: AppPlan;
  status: AppStatus;
}[] = [
  { name: "book-tracker", plan: "paid", status: "ready" },
  { name: "invoice-search", plan: "free", status: "provisioning" },
  { name: "standup-notes", plan: "free", status: "error" },
  { name: "recipe-box", plan: "free", status: "stopped" },
];
