import { createNeonClient } from "@/lib/neon-client";

import type { Branch } from "./branch-tree";
import { BranchTree } from "./branch-tree";

/**
 * Server component: list a project's branches and draw the tree with the
 * default branch selected. `updatedAt` comes from the branch; fill `state`
 * from the compute endpoints (listProjectBranchEndpoints) if you want the
 * node to reflect live compute. Wire onValueChange in a client wrapper.
 */
export const BranchTreeExample = async ({
  projectId,
}: {
  projectId: string;
}) => {
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");
  const { data } = await neon.branches.list(projectId).all();

  const branches: Branch[] = (data ?? []).map((branch) => ({
    default: branch.default,
    id: branch.id,
    name: branch.name,
    parent: branch.parent_id,
    protected: branch.protected,
    updatedAt: branch.updated_at,
  }));

  const defaultBranch = branches.find((branch) => branch.default);

  return <BranchTree branches={branches} defaultValue={defaultBranch?.id} />;
};
