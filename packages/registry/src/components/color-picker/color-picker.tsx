"use client";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- the 2D saturation/brightness plane and styled hue rail have no native input equivalent; both implement the full slider keyboard contract */

import { Popover } from "@base-ui/react/popover";
import {
  ColorPickerIcon,
  Copy01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  /** Controlled hex value, e.g. "#00e599". */
  value?: string;
  /** Uncontrolled initial hex value. */
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  /** Preset swatches rendered under the field. */
  swatches?: string[];
  disabled?: boolean;
  className?: string;
  /** Accessible label for the trigger. */
  label?: string;
}

/* ─────────────────────────────────────────────────────────
 * COLOR MATH — HSV internally, hex at the edges. Hue is
 * kept in state (not re-derived) so the rail doesn't snap
 * to 0 when saturation or value hit their extremes.
 * ───────────────────────────────────────────────────────── */
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const HEX_RE = /^#?(?<hex>[0-9a-f]{6})$/iu;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const hexToHsv = (hex: string): Hsv | null => {
  const match = HEX_RE.exec(hex.trim());

  if (!match?.groups?.hex) {
    return null;
  }

  const int = Number.parseInt(match.groups.hex, 16);
  const r = Math.floor(int / 65_536) / 255;
  const g = Math.floor((int % 65_536) / 256) / 255;
  const b = (int % 256) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta > 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  return {
    h: (h + 360) % 360,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
};

export const hsvToHex = ({ h, s, v }: Hsv): string => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const channel = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(channel * 255)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${f(5)}${f(3)}${f(1)}`;
};

/**
 * Shared square thumb: filled with the color it points at, white ring,
 * transform-centered. Swells slightly while its plane is being dragged so
 * the hand feels the grab; settles back on release.
 */
const Thumb = ({
  dragging,
  style,
}: {
  dragging?: boolean;
  style: CSSProperties;
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "pointer-events-none absolute size-3 origin-center border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)] transition-transform duration-150 motion-reduce:transition-none",
      dragging
        ? "-translate-x-1/2 -translate-y-1/2 scale-125"
        : "-translate-x-1/2 -translate-y-1/2"
    )}
    style={style}
  />
);

interface EyeDropperResult {
  sRGBHex: string;
}

type EyeDropperConstructor = new () => {
  open: () => Promise<EyeDropperResult>;
};

const getEyeDropper = (): EyeDropperConstructor | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = (window as { EyeDropper?: EyeDropperConstructor })
    .EyeDropper;
  return candidate ?? null;
};

/** Turn a pointer event into 0-1 coordinates within the target. */
const fraction = (event: PointerEvent<HTMLDivElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: clamp01((event.clientX - rect.left) / rect.width),
    y: clamp01((event.clientY - rect.top) / rect.height),
  };
};

const arrowDelta = (key: string): [number, number] | null => {
  switch (key) {
    case "ArrowUp": {
      return [0, -1];
    }
    case "ArrowDown": {
      return [0, 1];
    }
    case "ArrowLeft": {
      return [-1, 0];
    }
    case "ArrowRight": {
      return [1, 0];
    }
    default: {
      return null;
    }
  }
};

export const ColorPicker = ({
  className,
  defaultValue = "#00e599",
  disabled = false,
  label = "Color",
  onValueChange,
  swatches,
  value,
  ...props
}: ColorPickerProps) => {
  const [hsv, setHsv] = useState<Hsv>(
    () => hexToHsv(defaultValue) ?? { h: 160, s: 1, v: 0.9 }
  );
  // Hex input draft, only while the field is being edited.
  const [draft, setDraft] = useState<string | null>(null);
  // Controlled value changes re-seed HSV during render (no effect needed).
  const [seenValue, setSeenValue] = useState(value);

  if (value !== seenValue) {
    setSeenValue(value);
    const parsed = value ? hexToHsv(value) : null;

    if (parsed) {
      setHsv(parsed);
    }
  }

  const hex = (value ?? hsvToHex(hsv)).toLowerCase();
  const [dragging, setDragging] = useState<"field" | "hue" | null>(null);
  const [copied, setCopied] = useState(false);
  const eyeDropper = getEyeDropper();

  const commit = (next: Hsv) => {
    setHsv(next);
    setDraft(null);
    onValueChange?.(hsvToHex(next));
  };

  const commitHex = (candidate: string) => {
    const parsed = hexToHsv(candidate);

    if (parsed) {
      commit(parsed);
    } else {
      setDraft(null);
    }
  };

  const pickFromScreen = async () => {
    if (!eyeDropper) {
      return;
    }

    try {
      const result = await new eyeDropper().open();
      commitHex(result.sRGBHex);
    } catch {
      // Dismissed the eyedropper; keep the current color.
    }
  };

  const copyHex = async () => {
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const handleFieldPointer = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging("field");
    const { x, y } = fraction(event);
    commit({ ...hsv, s: x, v: 1 - y });
  };

  const handleFieldKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = arrowDelta(event.key);

    if (!delta) {
      return;
    }

    event.preventDefault();
    const step = event.shiftKey ? 0.1 : 0.02;
    commit({
      ...hsv,
      s: clamp01(hsv.s + delta[0] * step),
      v: clamp01(hsv.v - delta[1] * step),
    });
  };

  const handleHuePointer = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging("hue");
    commit({ ...hsv, h: fraction(event).x * 360 });
  };

  const handleHueKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = arrowDelta(event.key);

    if (!delta) {
      return;
    }

    event.preventDefault();
    const step = event.shiftKey ? 30 : 4;
    commit({ ...hsv, h: (hsv.h + delta[0] * step + 360) % 360 });
  };

  const hueOnly = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`${label}: ${hex}`}
        className={cn(
          "inline-flex h-8 cursor-pointer select-none items-center gap-2 rounded-md border border-border/60 bg-card px-2 font-mono text-foreground text-xs shadow-none ring-0 transition-colors hover:border-border focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        data-slot="color-picker"
        disabled={disabled}
        {...props}
      >
        <span
          aria-hidden="true"
          className="size-4 shrink-0 border border-border/60 transition-[background-color] duration-150"
          style={{ backgroundColor: hex }}
        />
        {hex}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" side="bottom" sideOffset={4}>
          <Popover.Popup
            className="z-50 w-56 rounded-md bg-popover p-3 text-popover-foreground shadow-none outline-none ring-1 ring-border/60 duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0"
            data-slot="color-picker-popup"
          >
            <div
              aria-label="Saturation and brightness"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(hsv.v * 100)}
              aria-valuetext={hex}
              className="relative h-36 cursor-crosshair touch-none focus-visible:outline focus-visible:outline-primary"
              data-slot="color-picker-field"
              onKeyDown={handleFieldKey}
              onPointerDown={handleFieldPointer}
              onPointerMove={(event) => {
                if (event.buttons > 0) {
                  handleFieldPointer(event);
                }
              }}
              onPointerUp={() => setDragging(null)}
              role="slider"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${hueOnly}`,
              }}
              tabIndex={disabled ? -1 : 0}
            >
              <Thumb
                dragging={dragging === "field"}
                style={{
                  backgroundColor: hex,
                  left: `${hsv.s * 100}%`,
                  top: `${(1 - hsv.v) * 100}%`,
                }}
              />
            </div>

            <div
              aria-label="Hue"
              aria-valuemax={360}
              aria-valuemin={0}
              aria-valuenow={Math.round(hsv.h)}
              className="relative mt-3 h-3 cursor-ew-resize touch-none focus-visible:outline focus-visible:outline-primary"
              data-slot="color-picker-hue"
              onKeyDown={handleHueKey}
              onPointerDown={handleHuePointer}
              onPointerMove={(event) => {
                if (event.buttons > 0) {
                  handleHuePointer(event);
                }
              }}
              onPointerUp={() => setDragging(null)}
              role="slider"
              style={{
                background:
                  "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
              }}
              tabIndex={disabled ? -1 : 0}
            >
              <Thumb
                dragging={dragging === "hue"}
                style={{
                  backgroundColor: hueOnly,
                  left: `${(hsv.h / 360) * 100}%`,
                  top: "50%",
                }}
              />
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <span className="font-mono text-muted-foreground text-xs">#</span>
              <input
                aria-label="Hex value"
                className="h-7 w-full min-w-0 border border-border/60 bg-transparent px-1.5 font-mono text-base outline-none transition-colors focus:border-primary sm:text-xs"
                onBlur={() => commitHex(draft ?? hex)}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitHex(draft ?? hex);
                  }
                }}
                spellCheck={false}
                value={(draft ?? hex).replace("#", "")}
              />
              <button
                aria-label={copied ? "Copied" : "Copy hex"}
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:border-primary focus-visible:outline-none"
                onClick={copyHex}
                type="button"
              >
                {copied ? (
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-3 text-primary"
                    icon={Tick02Icon}
                    strokeWidth={2}
                  />
                ) : (
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-3"
                    icon={Copy01Icon}
                    strokeWidth={2}
                  />
                )}
              </button>
              {eyeDropper ? (
                <button
                  aria-label="Pick a color from the screen"
                  className="flex size-7 shrink-0 cursor-pointer items-center justify-center border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:border-primary focus-visible:outline-none"
                  onClick={pickFromScreen}
                  type="button"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-3"
                    icon={ColorPickerIcon}
                    strokeWidth={2}
                  />
                </button>
              ) : null}
            </div>

            {swatches?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {swatches.map((swatch) => (
                  <button
                    aria-label={`Use ${swatch}`}
                    aria-pressed={swatch.toLowerCase() === hex}
                    className={cn(
                      "size-5 cursor-pointer border transition-[border-color,transform] duration-150 hover:scale-110 hover:border-foreground focus-visible:border-primary focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100",
                      swatch.toLowerCase() === hex
                        ? "border-foreground shadow-[0_0_0_1px_var(--background)_inset]"
                        : "border-border/60"
                    )}
                    key={swatch}
                    onClick={() => commitHex(swatch)}
                    style={{ backgroundColor: swatch }}
                    type="button"
                  />
                ))}
              </div>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
