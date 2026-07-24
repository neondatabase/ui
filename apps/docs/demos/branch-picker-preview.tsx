/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { BranchPickerDemo } from "@neon-ui/registry/components/branch-picker/demo";

import source from "../../../packages/registry/src/components/branch-picker/demo.tsx?raw";
import { highlightedHtml } from "./generated/branch-picker-preview";
import PreviewTabs from "./preview-tabs";

export default function BranchPickerPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={320} source={source}>
      <BranchPickerDemo />
    </PreviewTabs>
  );
}
