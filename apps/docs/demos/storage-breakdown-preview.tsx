/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { StorageBreakdownDemo } from "@neon-ui/registry/components/storage-breakdown/demo";

import source from "../../../packages/registry/src/components/storage-breakdown/demo.tsx?raw";
import { highlightedHtml } from "./generated/storage-breakdown-preview";
import PreviewTabs from "./preview-tabs";

export default function StorageBreakdownPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={380} source={source}>
      <StorageBreakdownDemo />
    </PreviewTabs>
  );
}
