/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { BranchDiffDemo } from "@neon-ui/registry/components/branch-diff/demo";

import source from "../../../packages/registry/src/components/branch-diff/demo.tsx?raw";
import { highlightedHtml } from "./generated/branch-diff-preview";
import PreviewTabs from "./preview-tabs";

export default function BranchDiffPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={640} source={source}>
      <BranchDiffDemo />
    </PreviewTabs>
  );
}
