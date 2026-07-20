/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { RegionCardDemo } from "@neon-ui/registry/components/region-card/demo";

import source from "../../../packages/registry/src/components/region-card/demo.tsx?raw";
import { highlightedHtml } from "./generated/region-card-preview";
import PreviewTabs from "./preview-tabs";

export default function RegionCardPreview() {
  return (
    <PreviewTabs minHeight={280} highlighted={highlightedHtml} source={source}>
      <RegionCardDemo />
    </PreviewTabs>
  );
}
