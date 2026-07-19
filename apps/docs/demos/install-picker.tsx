"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@neon-ui/registry/components/ui/popover";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";

/* ─────────────────────────────────────────────────────────
 * INSTALL PICKER STORYBOARD
 *
 * The install command is real and interactive: the
 * component name is the control.
 *
 *  rest    the command reads as one mono line; the name
 *          segment carries a dotted underline and a small
 *          chevron — the only hint it's alive
 *  open    the popup rises 4px above the pill (150ms
 *          strong ease-out): the catalog in mono, the
 *          current name marked with a primary square
 *  pick    the popup closes, the name swaps in place, and
 *          the full command auto-copies — the chevron
 *          yields to a primary check for a moment (same
 *          footprint, zero width change), then returns
 *  keys    Base UI popover: focus management, Escape,
 *          outside-click; every row is a real button
 *  motion  static under prefers-reduced-motion
 * ───────────────────────────────────────────────────────── */
const NAMES = [
  "auth-form",
  "agent-chat",
  "model-select",
  "thinking-model-select",
  "app-creator",
  "preview-frame",
  "checkpoint-timeline",
  "provisioning-status",
  "usage-panel",
  "upgrade-dialog",
  "metric-card",
  "date-range-picker",
  "neon-aurora",
] as const;

const COPIED_MS = 1400;

export default function InstallPicker() {
  const [name, setName] = useState<string>(NAMES[0]);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pick = async (next: string) => {
    setName(next);
    setOpen(false);
    await navigator.clipboard.writeText(
      `npx shadcn@latest add https://ui.neon.com/r/${next}.json`
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <code className="inline-flex h-10 items-center rounded-full border border-white/20 bg-black/50 px-4 font-mono text-white/75 text-xs backdrop-blur">
      npx shadcn@latest add https://ui.neon.com/r/
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger className="inline-flex items-center gap-1 text-white underline decoration-dotted decoration-white/40 underline-offset-4 transition-colors hover:decoration-primary">
          {name}
          {copied ? (
            <CheckIcon aria-label="Copied" className="size-3 text-primary" />
          ) : (
            <ChevronDownIcon
              className={`size-3 text-white/50 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            />
          )}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-h-72 overflow-y-auto p-1.5 preview-scroll"
          side="top"
          sideOffset={10}
        >
          {NAMES.map((option) => (
            <button
              className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left font-mono text-xs transition-colors ${
                option === name
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              key={option}
              onClick={() => pick(option)}
              type="button"
            >
              <span
                aria-hidden="true"
                className={`size-1.5 shrink-0 ${option === name ? "bg-primary" : "bg-transparent"}`}
              />
              {option}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      .json
    </code>
  );
}
