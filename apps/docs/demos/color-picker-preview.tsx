/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ColorPickerDemo } from "@neon-ui/registry/components/color-picker/demo";

import source from "../../../packages/registry/src/components/color-picker/demo.tsx?raw";
import { highlightedHtml } from "./generated/color-picker-preview";
import PreviewTabs from "./preview-tabs";

export default function ColorPickerPreview() {
  return (
    <PreviewTabs minHeight={360} highlighted={highlightedHtml} source={source}>
      <ColorPickerDemo />
    </PreviewTabs>
  );
}
