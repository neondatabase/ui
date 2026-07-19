/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ModelSelectDemo } from "@neon-ui/registry/components/model-select/demo";

import source from "../../../packages/registry/src/components/model-select/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function ModelSelectPreview() {
  return (
    <PreviewTabs minHeight={320} source={source}>
      <ModelSelectDemo />
    </PreviewTabs>
  );
}
