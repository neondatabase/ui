import type { AppStatus } from "@/components/status-badge/status-badge";

import { AppCard } from "./app-card";

/** Minimal shape of a Neon project (`GET /projects`). */
interface NeonProject {
  id: string;
  name: string;
  updated_at: string;
  // Derived from the project's default endpoint state by your API layer.
  endpoint_state?: "init" | "active" | "idle";
}

const projectStatus = (project: NeonProject): AppStatus => {
  switch (project.endpoint_state) {
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

const timeAgo = (iso: string) => {
  const seconds = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { style: "narrow" });

  for (const [unit, span] of units) {
    if (seconds >= span) {
      return formatter.format(-Math.floor(seconds / span), unit);
    }
  }

  return "just now";
};

/** Render a tenant's Neon projects as a dashboard grid. */
export const AppCardExample = ({ projects }: { projects: NeonProject[] }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {projects.map((project) => (
      <AppCard
        href={`/apps/${project.id}`}
        key={project.id}
        name={project.name}
        status={projectStatus(project)}
        updatedAt={timeAgo(project.updated_at)}
      />
    ))}
  </div>
);
