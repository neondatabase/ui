/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { CheckpointTimelineDemo } from "@neon-ui/registry/components/checkpoint-timeline/demo";

import source from "../../../packages/registry/src/components/checkpoint-timeline/demo.tsx?raw";
import { highlightedHtml } from "./generated/checkpoint-timeline-preview";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={360} highlighted={highlightedHtml} source={source}>
      <CheckpointTimelineDemo />
    </PreviewTabs>
  );
}
