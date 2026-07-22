/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ChainOfThoughtDemo } from "@neon-ui/registry/components/chain-of-thought/demo";

import source from "../../../packages/registry/src/components/chain-of-thought/demo.tsx?raw";
import { highlightedHtml } from "./generated/chain-of-thought-preview";
import PreviewTabs from "./preview-tabs";

export default function ChainOfThoughtPreview() {
  return (
    <PreviewTabs minHeight={320} highlighted={highlightedHtml} source={source}>
      <ChainOfThoughtDemo />
    </PreviewTabs>
  );
}
