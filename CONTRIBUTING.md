# Contributing to Neon UI

Thanks for helping build the official Neon UI Registry. This guide covers how the repo is structured, the standards every change follows, and how to get a PR merged.

## Setup

Neon UI is a pnpm monorepo. You need Node 22.12+ and pnpm.

```bash
pnpm install
pnpm dev          # Blume docs site at localhost:4321
```

Two workspaces:

- `packages/registry` — the shadcn registry (component source, theme tokens, shared lib)
- `apps/docs` — the Blume docs site

## Branch naming

Branches follow [Conventional Branch](https://conventional-branch.github.io/): `<type>/<short-description>`.

| Type        | Use                              |
| ----------- | -------------------------------- |
| `feat/`     | New component, block, or feature |
| `fix/`      | Bug fix                          |
| `chore/`    | Tooling, deps, config            |
| `docs/`     | Docs only                        |
| `refactor/` | No behaviour change              |
| `ci/`       | CI and build                     |

Branch from `main`. Never commit directly to `main`.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and are enforced by commitlint (`.commitlintrc.json`). The scope, when used, must be one of:

`registry`, `components`, `blocks`, `hooks`, `lib`, `styles`, `docs`, `brand`, `deps`, `ci`, `release`.

```
feat(components): add BranchPicker
fix(hooks): handle empty branch list in useBranches
docs(brand): document logo usage
```

Component additions are `feat` commits, so each one lands as a minor release with its own changelog entry.

## The component standard

Every component in `packages/registry/src/components/<name>/` ships four artifacts, checked in CI by `pnpm verify:components`:

1. `<name>.tsx` — presentational component. Takes data as props. No fetching, no env vars.
2. `use-<name>.ts` — optional data hook wrapping the real Neon surface (TS SDK, Data API, AI Gateway).
3. `fixtures.ts` — realistic mock data, typed with the component's props.
4. `demo.tsx` + `example.tsx` — demo renders with fixtures for the docs; example shows the real Neon wiring and must typecheck.

Each component also needs a `registry.json` entry and a docs page under `apps/docs/docs/<category>/`.

## Before you push

```bash
pnpm check              # oxlint + oxfmt (Ultracite)
pnpm typecheck
pnpm lint:md            # markdownlint
pnpm verify:components
pnpm build:registry     # registry JSON must build; commit the output in public/r/
pnpm build:docs         # docs must build
```

CI runs all of these plus a stale-registry check (the committed `public/r/` must match a fresh build) and commitlint. A PR that fails any of them won't merge.

## Pull requests

- Open against `main` as a **draft** while WIP.
- Fill out the PR template completely. Screenshots are required for UI and docs changes (light and dark mode where relevant).
- Keep PRs focused. Don't bundle unrelated changes.
- Feature branches squash merge. Delete the branch after merge.

## Changelog

The site's [/changelog](https://ui.neon.com/changelog) timeline is fed automatically: when a PR merges to `main`, CI parses the PR's `## Changelog` section and prepends an entry to `apps/docs/demos/changelog-entries.json`.

Write one bullet per user-facing change. End a bullet with `-> /route` to link it to the live docs page it ships on:

```markdown
## Changelog

- `HalftoneBloom` halftone screen lit by drifting color lights -> /brand/halftone-bloom
- Reduced-motion fixes across the shader components
```

Rules:

- Wrap component names in backticks; they render as code in the timeline.
- The entry's kind tag (`new`, `fix`, `docs`, ...) comes from your PR title's conventional-commit type.
- The entry's title comes from the PR title summary, its date and author from the merge.
- Omit the section (or write `- None`) for changes with nothing user-facing; no entry is recorded.
- To curate history (merge days, reword, add links), edit `changelog-entries.json` directly.

## Brand

This registry uses Neon's name and assets under their [brand guidelines](https://neon.com/brand). Don't edit, recolor, or reconstruct the logo. Use the vendored assets in `apps/docs/public/brand/` as-is. Neon-inspired visuals (backgrounds, themes) use the palette, not the mark.
