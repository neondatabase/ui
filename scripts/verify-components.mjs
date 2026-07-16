/**
 * Component-standard check: every component in packages/registry/src/components
 * must ship the four artifacts (source, fixtures, demo, example) plus be
 * listed in registry.json. Hooks are optional.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const registryRoot = new URL("../packages/registry", import.meta.url).pathname;
const componentsDir = path.join(registryRoot, "src/components");
const manifest = JSON.parse(
  readFileSync(path.join(registryRoot, "registry.json"), "utf-8")
);
const manifestNames = new Set(manifest.items.map((item) => item.name));

// `ui/` holds shared shadcn-style primitives (button, card, ...), not
// registry components, so it is exempt from the four-artifact standard.
const EXEMPT_DIRS = new Set(["ui"]);

const components = existsSync(componentsDir)
  ? readdirSync(componentsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !EXEMPT_DIRS.has(entry.name))
      .map((entry) => entry.name)
  : [];

const failures = [];

for (const name of components) {
  const dir = path.join(componentsDir, name);
  const required = [`${name}.tsx`, "fixtures.ts", "demo.tsx", "example.tsx"];

  for (const file of required) {
    if (!existsSync(path.join(dir, file))) {
      failures.push(`${name}: missing ${file}`);
    }
  }

  if (!manifestNames.has(name)) {
    failures.push(`${name}: not listed in registry.json`);
  }
}

if (failures.length > 0) {
  console.error("Component standard check failed:\n");
  for (const failure of failures) {
    console.error(`  ✗ ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Component standard check passed (${components.length} components).`
);
