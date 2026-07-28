---
name: registry-items
description: Author and change items in the Neon UI shadcn registry so `npx shadcn add` produces code that compiles in a consumer's project. Covers how shadcn routes each file by registry type, why a `./sibling` import breaks after install, when a file needs an `@/` alias instead, and the rule that an item must declare every registry item and npm package it imports. Use when adding a component, block, hook, or lib to `packages/registry`, when editing `registry.json`, when `pnpm verify:components` fails, or when a consumer reports that an installed component does not type-check.
---

# Registry items

The registry is not a library. Nothing is imported from a package — `npx shadcn add <url>` copies source files into someone else's project, and from that moment it's their code. That copy is the only thing that matters, and it is **not** what this repo looks like.

Everything below follows from one fact: **paths that resolve here often don't resolve after install.**

## shadcn re-homes files by type

Each entry in an item's `files` array carries a `type`, and shadcn uses it to pick a destination from the consumer's `components.json` aliases:

| Registry type | Lands in |
| --- | --- |
| `registry:component`, `registry:block` | their `components` alias, keeping the last folder — `src/components/branch-diff/branch-diff.tsx` |
| `registry:ui` | their `ui` alias — `src/components/ui/select.tsx` |
| `registry:hook` | their `hooks` alias, **flattened** — `src/hooks/use-branch-diff.ts` |
| `registry:lib` | their `lib` alias |

Note what happens to hooks. In this repo a hook sits next to its component in `src/components/<name>/`. After install it does not: the component is under `components/<name>/` and the hook is under `hooks/`. They are no longer siblings.

## Rule 1 — `./` only reaches files of the same type

A relative import is safe only when the target is shipped by the same item **and** declared with the same `type`, because only then do both files land in the same directory.

```ts
// src/components/neon-aurora/neon-aurora.tsx  (registry:component)
import { AURORA_FRAGMENT } from "./neon-aurora-shader"; // fine — also registry:component
```

Crossing a type boundary is the bug that shipped four broken components:

```ts
// src/components/branch-diff/use-branch-diff.ts  (registry:hook)
import type { TableDataDiff } from "./branch-diff"; // resolves here, dangles after install
```

Use the `@/` alias instead. shadcn rewrites `@/` to whatever the consumer configured, so it survives the move:

```ts
import type { TableDataDiff } from "@/components/branch-diff/branch-diff";
```

This is already the house style for anything cross-directory — `metric-card.tsx` reaches `@/components/neon-loader/neon-loader` the same way.

## Rule 2 — declare every import

An item ships in isolation. If a file imports something the item doesn't declare, shadcn never writes or installs it, and the consumer's build fails on a missing module.

**Another registry item** goes in `registryDependencies`, as a full URL into this registry (`utils` is shadcn's own item and stays a bare name):

```jsonc
"registryDependencies": [
  "utils",
  "https://ui.neon.com/r/neon-tokens.json",
  "https://ui.neon.com/r/select.json"   // because the component imports @/components/ui/select
]
```

**An npm package** goes in `dependencies` — every package the file imports, not just the interesting ones. Only `react` and `react-dom` are exempt, as peers:

```jsonc
"dependencies": ["@base-ui/react", "class-variance-authority", "motion"]
```

Forgetting these is easy precisely because the monorepo already has them installed, so nothing fails locally.

## The check that catches all of it

`pnpm verify:components` walks every file in `registry.json` and enforces both rules. It runs in CI, and it resolves providers from the manifest rather than guessing from names, so a genuine dependency expressed through another item passes.

```
✗ branch-diff: src/components/branch-diff/use-branch-diff.ts (registry:hook) imports
  "./branch-diff" (registry:component) — different types land in different
  directories, use an "@/" alias

✗ logs-viewer: src/components/logs-viewer/logs-viewer.tsx imports
  "@/components/ui/select" but "select" is missing from registryDependencies

✗ agent-chat: src/components/agent-chat/agent-chat.tsx imports "motion/react"
  but "motion" is missing from dependencies
```

Trust the failure. Each message names the file, the specifier, and the declaration to add.

## Registry output is committed

`packages/registry/public/r/*.json` is build output that lives in git, and CI runs `git diff --exit-code` on it. Any change to `registry.json` or to a shipped source file needs:

```bash
pnpm build:registry
```

and the regenerated JSON committed alongside. `demo.tsx`, `example.tsx`, and `fixtures.ts` are docs-only and are not shipped, so they can import however they like.

## Verify like a consumer, not like a maintainer

Type-checking this repo proves nothing about the installed result — the whole class of bug above passes `pnpm typecheck`. The only real test is an install into a clean project.

You don't need a deployment for it. `sync-registry.mjs` honours `REGISTRY_BASE_URL`, so point the build at a local server and every cross-item link resolves there too:

```bash
REGISTRY_BASE_URL=http://127.0.0.1:4325 pnpm build:docs
(cd apps/docs/dist && python3 -m http.server 4325 --bind 127.0.0.1)

# in a fresh create-next-app elsewhere
npx shadcn@latest add http://127.0.0.1:4325/r/<item>.json
npx next build
```

Use `127.0.0.1` rather than `localhost`: shadcn resolves `localhost` to IPv6 and the default Python server binds IPv4 only.

Two things the consumer supplies themselves, per the installation docs — `shadcn` (via `shadcn init`) and `tw-animate-css`. Anything else your component needs is your item's job to declare. Preview deployments sit behind Vercel's protection and return a redirect to `shadcn`, so the local server is the faster path.
