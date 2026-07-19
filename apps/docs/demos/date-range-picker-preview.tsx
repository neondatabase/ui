/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
"use client";

import { DateRangePickerDemo } from "@neon-ui/registry/components/date-range-picker/demo";

import source from "../../../packages/registry/src/components/date-range-picker/demo.tsx?raw";
import PreviewTabs from "./preview-tabs";

export default function AuthFormPreview() {
  return (
    <PreviewTabs minHeight={360} source={source}>
      <DateRangePickerDemo />
    </PreviewTabs>
  );
}
