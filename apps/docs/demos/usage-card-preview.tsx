/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { UsageCardDemo } from "@neon-ui/registry/components/usage-card/demo";

import source from "../../../packages/registry/src/components/usage-card/demo.tsx?raw";
import { highlightedHtml } from "./generated/usage-card-preview";
import PreviewTabs from "./preview-tabs";

export default function UsageCardPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={400} source={source}>
      <UsageCardDemo />
    </PreviewTabs>
  );
}
