/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { RegionGlobeDemo } from "@neon-ui/registry/components/region-globe/demo";

import source from "../../../packages/registry/src/components/region-globe/demo.tsx?raw";
import { highlightedHtml } from "./generated/region-globe-preview";
import PreviewTabs from "./preview-tabs";

export default function RegionGlobePreview() {
  return (
    <PreviewTabs minHeight={480} highlighted={highlightedHtml} source={source}>
      <RegionGlobeDemo />
    </PreviewTabs>
  );
}
