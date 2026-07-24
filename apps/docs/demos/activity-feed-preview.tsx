/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ActivityFeedDemo } from "@neon-ui/registry/components/activity-feed/demo";

import source from "../../../packages/registry/src/components/activity-feed/demo.tsx?raw";
import { highlightedHtml } from "./generated/activity-feed-preview";
import PreviewTabs from "./preview-tabs";

export default function ActivityFeedPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={420} source={source}>
      <ActivityFeedDemo />
    </PreviewTabs>
  );
}
