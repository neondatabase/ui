import { createNeonClient } from "@/lib/neon-client";

import type { Branch } from "./branch-picker";
import { BranchPicker } from "./branch-picker";

/**
 * Server component: list a project's branches and render the picker with the
 * default branch selected. Wire onValueChange/onCreateBranch in a client
 * wrapper (they mutate) or as server actions; the API key stays server-side.
 */
export const BranchPickerExample = async ({
  projectId,
}: {
  projectId: string;
}) => {
  const client = createNeonClient(process.env.NEON_API_KEY ?? "");
  const { data } = await client.listProjectBranches({ projectId });

  const branches: Branch[] = data.branches.map((branch) => ({
    default: branch.default,
    id: branch.id,
    name: branch.name,
    parent: branch.parent_id,
    protected: branch.protected,
  }));

  const defaultBranch = branches.find((branch) => branch.default);

  return <BranchPicker branches={branches} defaultValue={defaultBranch?.id} />;
};
