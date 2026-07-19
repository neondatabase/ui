/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ToolCallChipDemo } from "@neon-ui/registry/components/tool-call-chip/demo";

import source from "../../../packages/registry/src/components/tool-call-chip/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function ToolCallChipPreview() {
  return (
    <PreviewTabs minHeight={320} source={source}>
      <ToolCallChipDemo />
    </PreviewTabs>
  );
}
