/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { SchemaExplorerDemo } from "@neon-ui/registry/components/schema-explorer/demo";

import source from "../../../packages/registry/src/components/schema-explorer/demo.tsx?raw";
import { highlightedHtml } from "./generated/schema-explorer-preview";
import PreviewTabs from "./preview-tabs";

export default function SchemaExplorerPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={420} source={source}>
      <SchemaExplorerDemo />
    </PreviewTabs>
  );
}
