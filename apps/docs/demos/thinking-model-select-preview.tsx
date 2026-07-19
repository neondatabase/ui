/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ThinkingModelSelectDemo } from "@neon-ui/registry/components/thinking-model-select/demo";

import source from "../../../packages/registry/src/components/thinking-model-select/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function ThinkingModelSelectPreview() {
  return (
    <PreviewTabs minHeight={320} source={source}>
      <ThinkingModelSelectDemo />
    </PreviewTabs>
  );
}
