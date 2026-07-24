/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { LogsViewerDemo } from "@neon-ui/registry/components/logs-viewer/demo";

import source from "../../../packages/registry/src/components/logs-viewer/demo.tsx?raw";
import { highlightedHtml } from "./generated/logs-viewer-preview";
import PreviewTabs from "./preview-tabs";

export default function LogsViewerPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={620} source={source}>
      <LogsViewerDemo />
    </PreviewTabs>
  );
}
