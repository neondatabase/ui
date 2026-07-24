/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { BranchTreeDemo } from "@neon-ui/registry/components/branch-tree/demo";

import source from "../../../packages/registry/src/components/branch-tree/demo.tsx?raw";
import { highlightedHtml } from "./generated/branch-tree-preview";
import PreviewTabs from "./preview-tabs";

export default function BranchTreePreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={360} source={source}>
      <BranchTreeDemo />
    </PreviewTabs>
  );
}
