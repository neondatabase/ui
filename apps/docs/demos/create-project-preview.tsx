/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { CreateProjectDemo } from "@neon-ui/registry/blocks/create-project/demo";

import source from "../../../packages/registry/src/blocks/create-project/demo.tsx?raw";
import { highlightedHtml } from "./generated/create-project-preview";
import PreviewTabs from "./preview-tabs";

export default function CreateProjectPreview() {
  return (
    <PreviewTabs
      fullSize
      fullSizeTitle="CreateProject — full size"
      minHeight={520}
      highlighted={highlightedHtml}
      source={source}
    >
      <CreateProjectDemo />
    </PreviewTabs>
  );
}
