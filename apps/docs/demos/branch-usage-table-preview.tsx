/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { BranchUsageTableDemo } from "@neon-ui/registry/components/branch-usage-table/demo";

import source from "../../../packages/registry/src/components/branch-usage-table/demo.tsx?raw";
import { highlightedHtml } from "./generated/branch-usage-table-preview";
import PreviewTabs from "./preview-tabs";

export default function BranchUsageTablePreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={400} source={source}>
      <BranchUsageTableDemo />
    </PreviewTabs>
  );
}
