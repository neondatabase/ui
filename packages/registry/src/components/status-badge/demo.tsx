import { dashboardApps } from "./fixtures";
import { PlanBadge, StatusBadge } from "./status-badge";

export const StatusBadgeDemo = () => (
  <div className="flex w-full max-w-sm flex-col gap-2">
    {dashboardApps.map((app) => (
      <div className="flex items-center gap-2" key={app.name}>
        <span className="min-w-32 font-mono text-foreground text-xs">
          {app.name}
        </span>
        <StatusBadge status={app.status} />
        <PlanBadge plan={app.plan} />
      </div>
    ))}
  </div>
);

export default StatusBadgeDemo;
