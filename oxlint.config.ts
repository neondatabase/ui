import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  ignorePatterns: [
    ...core.ignorePatterns,
    // Generated shadcn registry output, not authored source.
    "**/public/r/**",
    // Vendored shadcn/ui primitives, kept canonical.
    "**/components/ui/**",
  ],
});
