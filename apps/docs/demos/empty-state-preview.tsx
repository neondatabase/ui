/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { EmptyStateDemo } from "@neon-ui/registry/components/empty-state/demo";

import source from "../../../packages/registry/src/components/empty-state/demo.tsx?raw";
import { highlightedHtml } from "./generated/empty-state-preview";
import PreviewTabs from "./preview-tabs";

export default function EmptyStatePreview() {
  return (
    <PreviewTabs minHeight={320} highlighted={highlightedHtml} source={source}>
      <EmptyStateDemo />
    </PreviewTabs>
  );
}
