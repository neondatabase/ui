/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ComputeStatusDemo } from "@neon-ui/registry/components/compute-status/demo";

import source from "../../../packages/registry/src/components/compute-status/demo.tsx?raw";
import { highlightedHtml } from "./generated/compute-status-preview";
import PreviewTabs from "./preview-tabs";

export default function ComputeStatusPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={280} source={source}>
      <ComputeStatusDemo />
    </PreviewTabs>
  );
}
