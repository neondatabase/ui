/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { WorkspaceTabsDemo } from "@neon-ui/registry/components/workspace-tabs/demo";

import source from "../../../packages/registry/src/components/workspace-tabs/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={360} source={source}>
      <WorkspaceTabsDemo />
    </PreviewTabs>
  );
}
