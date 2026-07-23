/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { DBConnectionCardDemo } from "@neon-ui/registry/components/db-connection-card/demo";

import source from "../../../packages/registry/src/components/db-connection-card/demo.tsx?raw";
import { highlightedHtml } from "./generated/db-connection-card-preview";
import PreviewTabs from "./preview-tabs";

export default function DBConnectionCardPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={360} source={source}>
      <DBConnectionCardDemo />
    </PreviewTabs>
  );
}
