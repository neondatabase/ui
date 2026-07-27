/**
 * Keeps the docs' theme mirror honest.
 *
 * `apps/docs/theme.css` deliberately mirrors the registry's tokens: the
 * Blume preview frame injects it as plain CSS after Blume's own defaults,
 * and it has to cover both `.dark` (what consumer apps use) and
 * `[data-theme="dark"]` (what Blume toggles). That mirror can't be an
 * import, so it drifts — a chart palette changed in the registry once
 * looked unchanged on the docs site for an hour because of it.
 *
 * This copies every custom property the two files share from the registry
 * into the mirror, leaving mirror-only properties alone. Run with --check
 * in CI to fail on drift instead of silently serving stale colors.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const SOURCE = path.join(root, "packages/registry/src/styles/tokens.css");
const MIRROR = path.join(root, "apps/docs/theme.css");

const isCheck = process.argv.includes("--check");

/** Custom properties declared in the first block matching `selector`. */
const readBlock = (css, selector) => {
  const start = css.indexOf(`${selector} {`);

  if (start === -1) {
    return new Map();
  }

  const end = css.indexOf("\n}", start);
  const body = css.slice(start, end);
  const declarations = new Map();

  for (const match of body.matchAll(
    /^\s*(?<name>--[\w-]+):\s*(?<value>[^;]+);/gmu
  )) {
    declarations.set(match.groups.name, match.groups.value.trim());
  }

  return declarations;
};

/** Rewrites the values of shared properties inside one mirror block. */
const applyBlock = (css, selector, source) => {
  const start = css.indexOf(`${selector} {`);

  if (start === -1) {
    return { css, drift: [] };
  }

  const end = css.indexOf("\n}", start);
  const body = css.slice(start, end);
  const drift = [];

  const next = body.replaceAll(
    /^(?<indent>\s*)(?<name>--[\w-]+):\s*(?<value>[^;]+);/gmu,
    (line, indent, name, value) => {
      const expected = source.get(name);

      if (expected === undefined || expected === value.trim()) {
        return line;
      }

      drift.push({ actual: value.trim(), expected, name, selector });

      return `${indent}${name}: ${expected};`;
    }
  );

  return { css: css.slice(0, start) + next + css.slice(end), drift };
};

const source = await readFile(SOURCE, "utf-8");
const mirror = await readFile(MIRROR, "utf-8");

// The registry declares light on :root and dark on .dark; the mirror
// carries the same pairs under its own selectors.
const pairs = [
  { mirror: ":root", source: ":root" },
  { mirror: '.dark,\n[data-theme="dark"]', source: ".dark" },
];

let output = mirror;
const drift = [];

for (const pair of pairs) {
  const result = applyBlock(
    output,
    pair.mirror,
    readBlock(source, pair.source)
  );

  output = result.css;
  drift.push(...result.drift);
}

if (drift.length === 0) {
  console.log("Theme mirror is in sync with the registry tokens.");
  process.exit(0);
}

if (isCheck) {
  console.error(
    `apps/docs/theme.css has drifted from the registry tokens (${drift.length}):\n`
  );

  for (const entry of drift) {
    console.error(
      `  ✗ ${entry.name} in ${entry.selector.split("\n")[0]}: mirror has ${entry.actual}, registry has ${entry.expected}`
    );
  }

  console.error("\nRun `pnpm sync:tokens` to fix.");
  process.exit(1);
}

await writeFile(MIRROR, output);
console.log(`Synced ${drift.length} token(s) into apps/docs/theme.css:`);

for (const entry of drift) {
  console.log(`  ${entry.name}: ${entry.actual} -> ${entry.expected}`);
}
