/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { StatusBadgeDemo } from "@neon-ui/registry/components/status-badge/demo";

import source from "../../../packages/registry/src/components/status-badge/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function StatusBadgePreview() {
  return (
    <PreviewTabs minHeight={320} source={source}>
      <StatusBadgeDemo />
    </PreviewTabs>
  );
}
