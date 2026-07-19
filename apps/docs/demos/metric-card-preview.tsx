/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { MetricCardDemo } from "@neon-ui/registry/components/metric-card/demo";

import source from "../../../packages/registry/src/components/metric-card/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function MetricCardPreview() {
  return (
    <PreviewTabs minHeight={400} source={source}>
      <MetricCardDemo />
    </PreviewTabs>
  );
}
