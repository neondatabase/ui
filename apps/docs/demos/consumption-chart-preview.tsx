/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ConsumptionChartDemo } from "@neon-ui/registry/components/consumption-chart/demo";

import source from "../../../packages/registry/src/components/consumption-chart/demo.tsx?raw";
import { highlightedHtml } from "./generated/consumption-chart-preview";
import PreviewTabs from "./preview-tabs";

export default function ConsumptionChartPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={420} source={source}>
      <ConsumptionChartDemo />
    </PreviewTabs>
  );
}
