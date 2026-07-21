/*
 * Append a changelog entry from a merged PR.
 *
 * Reads the PR from env (set by .github/workflows/changelog.yml), parses
 * the "## Changelog" section of the PR body, and prepends an entry to
 * apps/docs/demos/changelog-entries.json. Skips silently when the PR
 * opts out (no section, or a section containing only "None").
 *
 * Item line format (one bullet per user-facing change):
 *   - `Component` did a thing -> /route/to/docs
 * The "-> /route" suffix is optional and becomes the item's live link.
 * The item kind comes from the PR title's conventional-commit type.
 *
 * Env: PR_TITLE, PR_BODY, PR_NUMBER, PR_AUTHOR, PR_MERGED_AT
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ENTRIES_PATH = path.join(
  import.meta.dirname,
  "..",
  "apps/docs/demos/changelog-entries.json"
);

/** GitHub logins mapped to display names for the byline. */
const AUTHORS = {
  "jal-co": "Justin Levine",
};

const KINDS = new Set(["feat", "fix", "docs", "perf", "refactor", "chore"]);

const title = process.env.PR_TITLE ?? "";
const body = process.env.PR_BODY ?? "";
const number = Number(process.env.PR_NUMBER);
const login = process.env.PR_AUTHOR ?? "";
const mergedAt = process.env.PR_MERGED_AT ?? new Date().toISOString();

// The "## Changelog" section, up to the next heading.
const section =
  /^##\s+Changelog\s*\n(?<block>[\s\S]*?)(?=^##\s|$(?![\s\S]))/mu.exec(
    body.replaceAll("\r\n", "\n")
  );

const lines = (section?.groups?.block ?? "")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("- "))
  .map((line) => line.slice(2).trim())
  .filter((line) => line.length > 0 && !/^none\.?$/iu.test(line));

if (lines.length === 0) {
  console.log(`PR #${number}: no changelog section, skipping.`);
  process.exit(0);
}

// Conventional-commit pieces of the PR title.
const titleMatch = /^(?<type>[a-z]+)(?:\([^)]*\))?!?:\s*(?<summary>.+)$/u.exec(
  title
);
const kind = KINDS.has(titleMatch?.groups?.type ?? "")
  ? titleMatch.groups.type
  : undefined;
const summary = titleMatch?.groups?.summary ?? title;

const items = lines.map((line) => {
  const linkMatch = /^(?<text>.*?)\s*->\s*(?<href>\/\S*)$/u.exec(line);
  const item = { text: linkMatch?.groups?.text ?? line };

  if (kind) {
    item.kind = kind;
  }
  if (linkMatch) {
    item.href = linkMatch.groups.href;
  }

  return item;
});

const entries = JSON.parse(readFileSync(ENTRIES_PATH, "utf-8"));

if (entries.some((entry) => entry.pr === number)) {
  console.log(`PR #${number}: entry already recorded, skipping.`);
  process.exit(0);
}

const entry = {
  author: AUTHORS[login] ?? login,
  date: mergedAt.slice(0, 10),
  items,
  pr: number,
  title: summary.charAt(0).toUpperCase() + summary.slice(1),
};

entries.unshift(entry);
writeFileSync(ENTRIES_PATH, `${JSON.stringify(entries, null, 2)}\n`);
console.log(
  `PR #${number}: recorded "${entry.title}" (${items.length} item(s)).`
);
