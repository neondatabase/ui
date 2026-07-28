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
const ALIAS_IMPORT = /(?:from|import)\s+"(?<specifier>@\/[^"]+)"/gu;
const PACKAGE_IMPORT =
  /(?:from|import)\s+"(?<specifier>[^".@][^"]*|@[^/"]+\/[^"]+)"/gu;

// Consumers bring these themselves; every other package an item imports has to
// be listed in `dependencies` so `shadcn add` installs it.
const PEER_PACKAGES = new Set(["react", "react-dom"]);

const packageName = (specifier) => {
  const segments = specifier.split("/");
  return specifier.startsWith("@")
    ? segments.slice(0, 2).join("/")
    : segments[0];
};

// `utils` is shadcn's own item, not one of ours, and every item already
// depends on it for `@/lib/utils`.
const SHADCN_PROVIDED = new Map([["src/lib/utils", "utils"]]);

// registryDependencies are written as absolute URLs into this registry, or as
// a bare name for shadcn's built-ins.
const dependencyNames = (item) =>
  new Set(
    (item.registryDependencies ?? []).map(
      (dependency) =>
        /\/r\/(?<name>[a-z0-9-]+)\.json$/u.exec(dependency)?.groups.name ??
        dependency
    )
  );

const withExtensions = (base) => [base, `${base}.ts`, `${base}.tsx`];

const providerByPath = new Map();
for (const item of manifest.items) {
  for (const file of item.files ?? []) {
    providerByPath.set(file.path, item.name);
  }
}

for (const item of manifest.items) {
  const files = item.files ?? [];
  // Only files shipped in the same item can be reached relatively, and only
  // when shadcn writes them to the same directory — which it does per type.
  const typeByPath = new Map(files.map((file) => [file.path, file.type]));
  const declared = dependencyNames(item);

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
      const sibling = withExtensions(resolved).find((candidate) =>
        typeByPath.has(candidate)
      );

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

    for (const match of source.matchAll(ALIAS_IMPORT)) {
      const { specifier } = match.groups;
      const resolved = specifier.replace("@/", "src/");
      const candidates = withExtensions(resolved);

      if (candidates.some((candidate) => typeByPath.has(candidate))) {
        continue;
      }

      const builtin = SHADCN_PROVIDED.get(resolved);
      if (builtin) {
        if (!declared.has(builtin)) {
          failures.push(
            `${item.name}: ${file.path} imports "${specifier}" but does not depend on "${builtin}"`
          );
        }
        continue;
      }

      const provider = candidates
        .map((candidate) => providerByPath.get(candidate))
        .find(Boolean);

      if (!provider) {
        failures.push(
          `${item.name}: ${file.path} imports "${specifier}", which no registry item provides`
        );
        continue;
      }

      if (!declared.has(provider)) {
        failures.push(
          `${item.name}: ${file.path} imports "${specifier}" but "${provider}" is missing from registryDependencies`
        );
      }
    }

    const packages = new Set(item.dependencies);

    // CSS resolves through the consumer's bundler, and the only package a
    // stylesheet reaches for is `shadcn`, which `shadcn init` guarantees.
    if (!/\.tsx?$/u.test(file.path)) {
      continue;
    }

    for (const match of source.matchAll(PACKAGE_IMPORT)) {
      const { specifier } = match.groups;

      if (specifier.startsWith("node:")) {
        continue;
      }

      const name = packageName(specifier);

      if (PEER_PACKAGES.has(name) || packages.has(name)) {
        continue;
      }

      failures.push(
        `${item.name}: ${file.path} imports "${specifier}" but "${name}" is missing from dependencies`
      );
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
