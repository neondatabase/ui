/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ApiKeyListDemo } from "@neon-ui/registry/components/api-key-list/demo";

import source from "../../../packages/registry/src/components/api-key-list/demo.tsx?raw";
import { highlightedHtml } from "./generated/api-key-list-preview";
import PreviewTabs from "./preview-tabs";

export default function ApiKeyListPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={420} source={source}>
      <ApiKeyListDemo />
    </PreviewTabs>
  );
}
