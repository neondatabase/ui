/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { AnimatedWashDemo } from "@neon-ui/registry/components/animated-wash/demo";

import source from "../../../packages/registry/src/components/animated-wash/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function AnimatedWashPreview() {
  return (
    <PreviewTabs minHeight={320} source={source}>
      <AnimatedWashDemo />
    </PreviewTabs>
  );
}
