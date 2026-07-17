"use client";

import { ChatWorkingIndicator } from "@neon-ui/registry/components/agent-chat/agent-chat";
import { metricConnections } from "@neon-ui/registry/components/metric-card/fixtures";
import { MetricCard } from "@neon-ui/registry/components/metric-card/metric-card";
import {
  defaultModelId,
  gatewayModels,
} from "@neon-ui/registry/components/model-select/fixtures";
import { ThinkingModelSelect } from "@neon-ui/registry/components/thinking-model-select/thinking-model-select";
import type { ThinkingEffort } from "@neon-ui/registry/components/thinking-select/thinking-select";
import { ToolCallChip } from "@neon-ui/registry/components/tool-call-chip/tool-call-chip";
import { Button } from "@neon-ui/registry/components/ui/button";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

const PLACEHOLDER = `Paste CSS variables:

:root {
  --primary: oklch(0.87 0.19 168);
  --background: oklch(0.17 0.004 200);
}

…or a tweakcn theme JSON:

{ "cssVars": { "dark": { "primary": "…" } } }`;

const TWEAKCN_CAFFEINE = "https://tweakcn.com/r/themes/caffeine.json";

const PRESETS: { label: string; value: string }[] = [
  { label: "Neon (default)", value: "" },
  {
    label: "Crimson",
    value: `--primary: oklch(0.72 0.19 25);
--background: oklch(0.15 0.01 25);
--card: oklch(0.19 0.015 25);
--border: oklch(0.32 0.02 25);`,
  },
  {
    label: "Violet",
    value: `--primary: oklch(0.68 0.17 290);
--background: oklch(0.16 0.02 290);
--card: oklch(0.2 0.025 290);
--border: oklch(0.33 0.03 290);`,
  },
];

/** Pull `--var: value` declarations out of pasted CSS, selectors and all. */
const parseCssVars = (css: string): Record<string, string> => {
  const vars: Record<string, string> = {};
  const declaration = /--(?<name>[\w-]+)\s*:\s*(?<value>[^;{}]+)[;}]/gu;

  for (const match of css.matchAll(declaration)) {
    if (match.groups?.name && match.groups.value) {
      vars[`--${match.groups.name}`] = match.groups.value.trim();
    }
  }

  return vars;
};

interface TweakcnTheme {
  cssVars?: Record<string, Record<string, string>>;
}

/**
 * A tweakcn registry item carries `cssVars.{theme,light,dark}` without the
 * `--` prefix. The docs site runs dark, so dark wins over light.
 */
const parseTweakcn = (json: string): Record<string, string> | null => {
  try {
    const item = JSON.parse(json) as TweakcnTheme;

    if (!item.cssVars) {
      return null;
    }

    const merged = {
      ...item.cssVars.theme,
      ...item.cssVars.light,
      ...item.cssVars.dark,
    };
    const vars: Record<string, string> = {};

    for (const [name, value] of Object.entries(merged)) {
      vars[`--${name}`] = value;
    }

    return vars;
  } catch {
    return null;
  }
};

const parseTheme = (input: string): Record<string, string> => {
  const trimmed = input.trim();

  if (trimmed.startsWith("{")) {
    return parseTweakcn(trimmed) ?? {};
  }

  return parseCssVars(trimmed);
};

export default function ThemePaster() {
  const [input, setInput] = useState("");
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [model, setModel] = useState(defaultModelId);
  const [effort, setEffort] = useState<ThinkingEffort>("medium");

  const vars = useMemo(() => parseTheme(input), [input]);
  // Canvas components sample token colors at mount, so remount on retheme.
  const themeKey = useMemo(() => JSON.stringify(vars), [vars]);

  const loadCaffeine = async () => {
    setLoadingPreset(true);

    try {
      const response = await fetch(TWEAKCN_CAFFEINE);
      setInput(JSON.stringify(await response.json(), null, 2));
    } catch {
      setInput("// Could not reach tweakcn.com — paste a theme JSON instead.");
    } finally {
      setLoadingPreset(false);
    }
  };

  return (
    <div className="not-prose grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              className="border border-border/60 px-2 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
              key={preset.label}
              onClick={() => setInput(preset.value)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
          <button
            className="border border-border/60 px-2 py-1 font-mono text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground disabled:opacity-50"
            disabled={loadingPreset}
            onClick={loadCaffeine}
            type="button"
          >
            {loadingPreset ? "loading…" : "Caffeine (tweakcn)"}
          </button>
        </div>
        <textarea
          aria-label="Paste CSS variables or a tweakcn theme JSON"
          className="min-h-64 flex-1 resize-y border border-border/60 bg-card p-3 font-mono text-xs leading-5 outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
          onChange={(event) => setInput(event.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          value={input}
        />
        <p className="text-muted-foreground text-xs">
          Takes a raw shadcn/Tailwind variable block or a{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://tweakcn.com"
            rel="noreferrer"
            target="_blank"
          >
            tweakcn
          </a>{" "}
          theme JSON. Every declaration is applied live — nothing is hardcoded
          to the Neon brand.
        </p>
      </div>

      <div
        className="flex flex-col gap-4 border border-border/60 bg-background p-5 text-foreground"
        key={themeKey}
        ref={setPanel}
        style={vars as CSSProperties}
      >
        <MetricCard {...metricConnections} />
        <div className="flex flex-wrap items-center gap-3">
          <ThinkingModelSelect
            effort={effort}
            models={gatewayModels}
            onEffortChange={setEffort}
            onValueChange={setModel}
            portalContainer={panel}
            size="sm"
            value={model}
          />
          <Button size="sm">Deploy</Button>
        </div>
        <div className="flex flex-col items-start gap-1">
          <ToolCallChip detail="src/db/schema.ts" name="writeFile" />
          <ToolCallChip
            detail="book tracker v1"
            name="checkpoint"
            state="running"
          />
        </div>
        <ChatWorkingIndicator />
      </div>
    </div>
  );
}
