/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { AppCardDemo } from "@neon-ui/registry/components/app-card/demo";

import source from "../../../packages/registry/src/components/app-card/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function AppCardPreview() {
  return (
    <PreviewTabs minHeight={400} source={source}>
      <AppCardDemo />
    </PreviewTabs>
  );
}
