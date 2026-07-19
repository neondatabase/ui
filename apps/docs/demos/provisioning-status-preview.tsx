/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ProvisioningStatusDemo } from "@neon-ui/registry/components/provisioning-status/demo";

import source from "../../../packages/registry/src/components/provisioning-status/demo.tsx?raw";
import { highlightedHtml } from "./generated/provisioning-status-preview";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={360} highlighted={highlightedHtml} source={source}>
      <ProvisioningStatusDemo />
    </PreviewTabs>
  );
}
