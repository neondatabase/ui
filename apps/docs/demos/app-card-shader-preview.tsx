/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import AppCardShaderDemo from "./app-card-shader-demo";
import source from "./app-card-shader-demo.tsx?raw";
import { highlightedHtml } from "./generated/app-card-shader-preview";
import PreviewTabs from "./preview-tabs";

export default function AppCardShaderPreview() {
  return (
    <PreviewTabs minHeight={280} highlighted={highlightedHtml} source={source}>
      <AppCardShaderDemo />
    </PreviewTabs>
  );
}
