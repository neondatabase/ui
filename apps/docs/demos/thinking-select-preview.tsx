/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ThinkingSelectDemo } from "@neon-ui/registry/components/thinking-select/demo";

import source from "../../../packages/registry/src/components/thinking-select/demo.tsx?raw";
import { highlightedHtml } from "./generated/thinking-select-preview";
import PreviewTabs from "./preview-tabs";

export default function ThinkingSelectPreview() {
  return (
    <PreviewTabs minHeight={320} highlighted={highlightedHtml} source={source}>
      <ThinkingSelectDemo />
    </PreviewTabs>
  );
}
