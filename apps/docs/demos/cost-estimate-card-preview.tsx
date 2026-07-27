/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { CostEstimateCardDemo } from "@neon-ui/registry/components/cost-estimate-card/demo";

import source from "../../../packages/registry/src/components/cost-estimate-card/demo.tsx?raw";
import { highlightedHtml } from "./generated/cost-estimate-card-preview";
import PreviewTabs from "./preview-tabs";

export default function CostEstimateCardPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={420} source={source}>
      <CostEstimateCardDemo />
    </PreviewTabs>
  );
}
