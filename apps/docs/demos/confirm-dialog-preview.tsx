/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { ConfirmDialogDemo } from "@neon-ui/registry/components/confirm-dialog/demo";

import source from "../../../packages/registry/src/components/confirm-dialog/demo.tsx?raw";
import { highlightedHtml } from "./generated/confirm-dialog-preview";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={360} highlighted={highlightedHtml} source={source}>
      <ConfirmDialogDemo />
    </PreviewTabs>
  );
}
