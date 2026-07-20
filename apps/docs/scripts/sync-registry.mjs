/**
 * Publishes the built registry into the docs deployment.
 *
 * Copies packages/registry/public/r/*.json into dist/r/, rewriting the
 * canonical base URL to the actual serving domain so item cross-links
 * (registryDependencies) resolve on whatever deployment serves them —
 * preview URLs included. `npx shadcn add <origin>/r/<item>.json` then
 * pulls its whole dependency chain from the same origin.
 *
 * Base URL resolution, first match wins:
 *   1. REGISTRY_BASE_URL           — explicit override
 *   2. VERCEL_PROJECT_PRODUCTION_URL — same source Blume uses for canonicals
 *   3. the canonical fallback (https://ui.neon.com)
 *
 * Runs after `blume build` (see package.json). Registry output is
 * committed, so no shadcn build is needed here.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const CANONICAL = "https://ui.neon.com";

const docsRoot = new URL("..", import.meta.url).pathname;
const sourceDir = path.join(docsRoot, "../../packages/registry/public/r");
const outDir = path.join(docsRoot, "dist/r");

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const base =
  process.env.REGISTRY_BASE_URL ??
  (vercelUrl ? `https://${vercelUrl}` : CANONICAL);

const files = readdirSync(sourceDir).filter((name) => name.endsWith(".json"));

mkdirSync(outDir, { recursive: true });

for (const name of files) {
  const text = readFileSync(path.join(sourceDir, name), "utf-8");
  writeFileSync(path.join(outDir, name), text.replaceAll(CANONICAL, base));
}

console.log(`sync-registry: ${files.length} items -> dist/r (base: ${base})`);
