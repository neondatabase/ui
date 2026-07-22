/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ReasoningDemo } from "@neon-ui/registry/components/reasoning/demo";

import source from "../../../packages/registry/src/components/reasoning/demo.tsx?raw";
import { highlightedHtml } from "./generated/reasoning-preview";
import PreviewTabs from "./preview-tabs";

export default function ReasoningPreview() {
  return (
    <PreviewTabs minHeight={320} highlighted={highlightedHtml} source={source}>
      <ReasoningDemo />
    </PreviewTabs>
  );
}
