/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { QueryHistoryDemo } from "@neon-ui/registry/components/query-history/demo";

import source from "../../../packages/registry/src/components/query-history/demo.tsx?raw";
import { highlightedHtml } from "./generated/query-history-preview";
import PreviewTabs from "./preview-tabs";

export default function QueryHistoryPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={620} source={source}>
      <QueryHistoryDemo />
    </PreviewTabs>
  );
}
