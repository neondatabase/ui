/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { UpgradeDialogDemo } from "@neon-ui/registry/components/upgrade-dialog/demo";

import source from "../../../packages/registry/src/components/upgrade-dialog/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={360} source={source}>
      <UpgradeDialogDemo />
    </PreviewTabs>
  );
}
