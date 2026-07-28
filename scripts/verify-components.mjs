/**
 * Component-standard check: every component in packages/registry/src/components
 * and every block in packages/registry/src/blocks must ship the four artifacts
 * (source, fixtures, demo, example) plus be listed in registry.json. Hooks are
 * optional.
 *
 * Also guards shipped files against relative imports that only resolve inside
 * this repo. `shadcn add` routes each file by its registry type — components to
 * the consumer's components alias, hooks to their hooks alias — so a `./sibling`
 * import between two different types resolves here and breaks there.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const registryRoot = new URL("../packages/registry", import.meta.url).pathname;
const componentsDir = path.join(registryRoot, "src/components");
const blocksDir = path.join(registryRoot, "src/blocks");
const manifest = JSON.parse(
  readFileSync(path.join(registryRoot, "registry.json"), "utf-8")
);
const manifestNames = new Set(manifest.items.map((item) => item.name));

// `ui/` holds shared shadcn-style primitives (button, card, ...), not
// registry components, so it is exempt from the four-artifact standard.
const EXEMPT_DIRS = new Set(["ui"]);

const listDirs = (root) =>
  existsSync(root)
    ? readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !EXEMPT_DIRS.has(entry.name))
        .map((entry) => ({
          dir: path.join(root, entry.name),
          name: entry.name,
        }))
    : [];

const components = [...listDirs(componentsDir), ...listDirs(blocksDir)];

const failures = [];

for (const { dir, name } of components) {
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

const RELATIVE_IMPORT = /(?:from|import)\s+"(?<specifier>\.\/[^"]+)"/gu;

for (const item of manifest.items) {
  const files = item.files ?? [];
  // Only files shipped in the same item can be reached relatively, and only
  // when shadcn writes them to the same directory — which it does per type.
  const typeByPath = new Map(files.map((file) => [file.path, file.type]));

  for (const file of files) {
    const absolute = path.join(registryRoot, file.path);

    if (!existsSync(absolute)) {
      failures.push(`${item.name}: registry.json lists missing ${file.path}`);
      continue;
    }

    const source = readFileSync(absolute, "utf-8");
    const dir = path.posix.dirname(file.path);

    for (const match of source.matchAll(RELATIVE_IMPORT)) {
      const { specifier } = match.groups;
      const resolved = path.posix.join(dir, specifier);
      const sibling = [".ts", ".tsx", ""]
        .map((extension) => `${resolved}${extension}`)
        .find((candidate) => typeByPath.has(candidate));

      if (!sibling) {
        failures.push(
          `${item.name}: ${file.path} imports "${specifier}", which is not shipped in the item`
        );
        continue;
      }

      if (typeByPath.get(sibling) !== file.type) {
        failures.push(
          `${item.name}: ${file.path} (${file.type}) imports "${specifier}" (${typeByPath.get(sibling)}) — different types land in different directories, use an "@/" alias`
        );
      }
    }
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
