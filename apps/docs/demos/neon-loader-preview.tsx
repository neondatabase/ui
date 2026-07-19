/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { NeonLoaderDemo } from "@neon-ui/registry/components/neon-loader/demo";

import source from "../../../packages/registry/src/components/neon-loader/demo.tsx?raw";
import { highlightedHtml } from "./generated/neon-loader-preview";
import PreviewTabs from "./preview-tabs";

export default function NeonLoaderPreview() {
  return (
    <PreviewTabs minHeight={320} highlighted={highlightedHtml} source={source}>
      <NeonLoaderDemo />
    </PreviewTabs>
  );
}
