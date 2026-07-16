import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  // The shadcn registry output is a generated artifact, not authored source.
  ignorePatterns: [...core.ignorePatterns, "**/public/r/**"],
});
