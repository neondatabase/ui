import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...ultracite.ignorePatterns,
    // Generated shadcn registry output, not authored source.
    "**/public/r/**",
    // Vendored shadcn/ui primitives; kept canonical so `shadcn add` re-runs
    // cleanly without reformatting drift.
    "**/components/ui/**",
  ],
});
