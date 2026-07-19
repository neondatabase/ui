# Neon UI

The UI layer for building applications on Neon: a [shadcn registry](https://ui.shadcn.com/docs/registry) of production-ready components for agent platforms and the products around them. You don't install a package — component source lands in your project and it's your code from that point on.

```bash
npx shadcn@latest add https://ui.neon.com/r/auth-form.json
```

**Docs:** [ui.neon.com](https://ui.neon.com)

## What's inside

23 components across four groups:

- **Agent** — the workspace where an agent builds and runs an app: AgentChat, ModelSelect, ThinkingSelect, ThinkingModelSelect, ToolCallChip, AppCreator, AppCard, PreviewFrame, WorkspaceTabs, ProvisioningStatus, CheckpointTimeline, UsagePanel, UpgradeDialog, StatusBadge, EmptyState
- **Platform** — the surfaces every product needs: AuthForm, ConfirmDialog, DateRangePicker, MetricCard, NeonLoader
- **Shaders** — brand light, rendered live: NeonAurora, AnimatedWash
- **Misc** — ColorPicker

Built on React 19, Tailwind v4, and Base UI primitives (`base-nova` style). Charts ride Visx. Model catalogs speak the [models.dev](https://models.dev) format. Auth shapes map 1:1 onto [Better Auth](https://better-auth.com).

## The house rules

Every component follows the same contract:

- **Presentational first** — data comes in as props; no fetching, no environment variables. Typed examples show the real wiring (Neon consumption APIs, models.dev, Better Auth).
- **Color is light** — hairline neutral frames; color belongs to the caret, the CTA, and the status vocabulary, never to card chrome.
- **Nothing shifts** — verdicts, overlays, and busy states animate in place; a shader cover panel beside a form never resizes.
- **Motion is reduced-motion safe** — every cascade, shimmer, and glide goes static under `prefers-reduced-motion`.
- **Four artifacts per component** — `<name>.tsx`, `fixtures.ts`, `demo.tsx`, `example.tsx`, enforced in CI.

## Repository

```
apps/docs               The documentation site (Blume)
packages/registry       Component source + built registry payloads
  src/components/       One folder per component
  public/r/             Built registry JSON (committed; CI verifies)
scripts/                Component-standard checks
```

### Development

```bash
pnpm install
pnpm --filter docs dev      # docs at localhost:4321
pnpm check                  # lint + format (ultracite)
pnpm typecheck
node scripts/verify-components.mjs
pnpm build:registry         # rebuild public/r before pushing
```

Branches follow Conventional Branch, commits follow Conventional Commits, and feature branches squash-merge.

## License

MIT
