/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { AutoscaleChartDemo } from "@neon-ui/registry/components/autoscale-chart/demo";

import source from "../../../packages/registry/src/components/autoscale-chart/demo.tsx?raw";
import { highlightedHtml } from "./generated/autoscale-chart-preview";
import PreviewTabs from "./preview-tabs";

export default function AutoscaleChartPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={320} source={source}>
      <AutoscaleChartDemo />
    </PreviewTabs>
  );
}
