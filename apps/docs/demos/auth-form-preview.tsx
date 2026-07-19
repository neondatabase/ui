/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { AuthFormDemo } from "@neon-ui/registry/components/auth-form/demo";

import source from "../../../packages/registry/src/components/auth-form/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={420} source={source}>
      <AuthFormDemo />
    </PreviewTabs>
  );
}
