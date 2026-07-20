# Audit workflow

<context>
Repeatable audit SOP for the neon-ui monorepo. Invoked as `audit <target>` or bare `audit`. Audits REPORT — they MUST NOT fix anything unless the user explicitly asks for fixes afterward.
</context>

<instructions>

## Trigger

- `audit <target>` — run the matching audit below.
- `audit` with no target — MUST ask which target, offering the list below as options (plus "full sweep"). MUST NOT guess.
- Unknown target — ask, showing the closest matches.

## Targets

<workflow>

### `component <name>` / `block <name>`

1. Four-artifact standard: `<name>.tsx`, `fixtures.ts`, `demo.tsx`, `example.tsx` present (`node scripts/verify-components.mjs`).
2. Listed in `packages/registry/registry.json` with correct `dependencies` / `registryDependencies` (every `@/components/*` and `@/hooks/*` import maps to a registry dep).
3. Blocks additionally: MUST compose registry items only — no private UI baked into the block.
4. `pnpm dlx ultracite check` on the folder; `pnpm --filter @neon-ui/registry typecheck`.
5. A11y checklist: real inputs behind decorative layers (canvas/WebGL is `aria-hidden`), labels on form fields, `aria-live` on dynamic readouts, keyboard path exists without pointer-only features, `prefers-reduced-motion` honored for spin/ping/crossfade.
6. Theme: colors come from tokens (probe spans or classes), never hardcoded hex; verify light + dark.
7. Docs page exists under `apps/docs/docs/**`, props table matches the actual prop types, preview island registered in `components.ts` and generated via `scripts/build-highlighted.mjs`.

### `registry`

1. `node scripts/verify-components.mjs`.
2. `pnpm build:registry` succeeds.
3. Cross-check `registry.json` deps against actual imports (grep `@/components/`, `@/hooks/` per item).
4. Flag heavyweight deps (e.g. Three.js) that lack a documented lightweight alternative.

### `docs`

1. `pnpm exec blume build --isolated` (never plain `blume build` while a dev server runs).
2. Every registry item of type component/block has an mdx page; props tables match source; internal links resolve.
3. Previews: island in `components.ts`, `*-preview.tsx` demo, generated highlight module current (re-run `build-highlighted.mjs`).

### `a11y`

Run the checklist from step 5 above across all components and blocks; report findings as `file:line — issue`.

### `motion`

Every animation (spin, ping halo, crossfade, camera flight, hover transforms) MUST be disabled or reduced under `prefers-reduced-motion`; hover states MUST NOT cause layout shift.

### `full`

All of the above, in the order listed.

</workflow>

## Report format

<rules>

- Findings MUST be prefixed `blocker:`, `suggestion:`, or `nit:` and cite `file:line`.
- MUST lead with the most important finding.
- MUST end with the commands run and their pass/fail status.
- A clean audit MUST say so explicitly (no-op is a valid result).

</rules>

</instructions>
