/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { AppCreatorDemo } from "@neon-ui/registry/components/app-creator/demo";

import source from "../../../packages/registry/src/components/app-creator/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function AppCreatorPreview() {
  return (
    <PreviewTabs minHeight={320} source={source}>
      <AppCreatorDemo />
    </PreviewTabs>
  );
}
