import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  // The shadcn registry output is a generated artifact, not authored source.
  ignorePatterns: [...ultracite.ignorePatterns, "**/public/r/**"],
});
