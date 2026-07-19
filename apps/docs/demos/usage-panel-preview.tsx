/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { UsagePanelDemo } from "@neon-ui/registry/components/usage-panel/demo";

import source from "../../../packages/registry/src/components/usage-panel/demo.tsx?raw";
import { highlightedHtml } from "./generated/usage-panel-preview";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={360} highlighted={highlightedHtml} source={source}>
      <UsagePanelDemo />
    </PreviewTabs>
  );
}
