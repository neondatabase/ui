import { EmptyState } from "./empty-state";

/** Minimal shape of a Neon project list response (`GET /projects`). */
interface NeonProjectList {
  projects: { id: string; name: string }[];
}

/**
 * Guard a project grid: render the list when populated, an intentional
 * empty state when the tenant has no projects yet.
 */
export const EmptyStateExample = ({
  data,
  children,
  onCreate,
}: {
  data: NeonProjectList;
  children: React.ReactNode;
  onCreate?: () => void;
}) => {
  if (data.projects.length > 0) {
    return children;
  }

  return (
    <EmptyState
      action={
        onCreate ? (
          <button
            className="border border-border/60 px-3 py-1.5 text-foreground text-xs transition-colors hover:border-border"
            onClick={onCreate}
            type="button"
          >
            Create a project
          </button>
        ) : undefined
      }
      description="Projects appear here once you create one; each gets its own Postgres."
      title="No projects yet"
    />
  );
};
