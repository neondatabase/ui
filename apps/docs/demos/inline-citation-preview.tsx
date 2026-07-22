/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { InlineCitationDemo } from "@neon-ui/registry/components/inline-citation/demo";

import source from "../../../packages/registry/src/components/inline-citation/demo.tsx?raw";
import { highlightedHtml } from "./generated/inline-citation-preview";
import PreviewTabs from "./preview-tabs";

export default function InlineCitationPreview() {
  return (
    <PreviewTabs minHeight={320} highlighted={highlightedHtml} source={source}>
      <InlineCitationDemo />
    </PreviewTabs>
  );
}
