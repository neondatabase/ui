/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { HealthCardDemo } from "@neon-ui/registry/components/health-card/demo";

import source from "../../../packages/registry/src/components/health-card/demo.tsx?raw";
import { highlightedHtml } from "./generated/health-card-preview";
import PreviewTabs from "./preview-tabs";

export default function HealthCardPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={400} source={source}>
      <HealthCardDemo />
    </PreviewTabs>
  );
}
