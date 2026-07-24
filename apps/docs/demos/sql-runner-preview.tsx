/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { SQLRunnerDemo } from "@neon-ui/registry/components/sql-runner/demo";

import source from "../../../packages/registry/src/components/sql-runner/demo.tsx?raw";
import { highlightedHtml } from "./generated/sql-runner-preview";
import PreviewTabs from "./preview-tabs";

export default function SQLRunnerPreview() {
  return (
    <PreviewTabs highlighted={highlightedHtml} minHeight={660} source={source}>
      <SQLRunnerDemo />
    </PreviewTabs>
  );
}
