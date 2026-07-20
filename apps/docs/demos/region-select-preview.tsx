/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { RegionSelectDemo } from "@neon-ui/registry/components/region-select/demo";

import source from "../../../packages/registry/src/components/region-select/demo.tsx?raw";
import { highlightedHtml } from "./generated/region-select-preview";
import PreviewTabs from "./preview-tabs";

export default function RegionSelectPreview() {
  return (
    <PreviewTabs minHeight={420} highlighted={highlightedHtml} source={source}>
      <RegionSelectDemo />
    </PreviewTabs>
  );
}
