import {
  flattenConsumption,
  sumBuckets,
  toCuHours,
  toGbMonths,
  toGigabytes,
} from "@/lib/consumption";
import { createNeonClient } from "@/lib/neon-client";

import type { BranchUsageRow } from "./branch-usage-table";
import { BranchUsageTable } from "./branch-usage-table";

const COLUMNS = [
  { id: "compute", label: "Compute", unit: "CU-hrs" },
  { id: "storage", label: "Storage", unit: "GB-mo" },
  { id: "transfer", label: "Transfer", unit: "GB" },
];

/**
 * Server component: the per-branch endpoint (beta) returns six of the eight
 * project metrics, split by branch. Storage here is root plus child, so a
 * branch that barely diverges from its parent shows a small number — that
 * delta is exactly what Neon charges for.
 *
 * The endpoint answers with branch ids, not names, so pair it with a
 * branch list to label the rows.
 */
export const BranchUsageTableExample = async ({
  orgId,
  projectId,
  from,
  to,
}: {
  orgId: string;
  projectId: string;
  from: string;
  to: string;
}) => {
  const neon = createNeonClient(process.env.NEON_API_KEY ?? "");

  const [{ data: consumption }, { data: branches }] = await Promise.all([
    neon.consumption
      .perBranchV2({
        from,
        granularity: "daily",
        metrics: [
          "compute_unit_seconds",
          "root_branch_bytes_month",
          "child_branch_bytes_month",
          "public_network_transfer_bytes",
        ],
        org_id: orgId,
        project_ids: [projectId],
        to,
      })
      .all(),
    neon.branches.list(projectId).all(),
  ]);

  const nameById = new Map(
    (branches ?? []).map((branch) => [branch.id, branch.name])
  );

  const rows: BranchUsageRow[] = (consumption ?? []).map((branch) => {
    const totals = sumBuckets(flattenConsumption(branch.periods));

    return {
      id: branch.branch_id,
      isDefault: nameById.get(branch.branch_id) === "main",
      metrics: {
        compute: toCuHours(totals.compute_unit_seconds ?? 0),
        storage: toGbMonths(
          (totals.root_branch_bytes_month ?? 0) +
            (totals.child_branch_bytes_month ?? 0)
        ),
        transfer: toGigabytes(totals.public_network_transfer_bytes ?? 0),
      },
      name: nameById.get(branch.branch_id) ?? branch.branch_id,
    };
  });

  return <BranchUsageTable columns={COLUMNS} rows={rows} topN={10} />;
};
