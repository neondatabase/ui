/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { PreviewFrameDemo } from "@neon-ui/registry/components/preview-frame/demo";

import source from "../../../packages/registry/src/components/preview-frame/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={440} source={source}>
      <PreviewFrameDemo />
    </PreviewTabs>
  );
}
