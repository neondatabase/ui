"use client";

import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { RegionCard } from "@/components/region-card/region-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  decodeRow,
  MAP_BITS,
  MAP_COLS,
  MAP_LAT_MAX,
  MAP_LAT_MIN,
  MAP_ROWS,
} from "./map-dots";

export interface ServerRegion {
  /** Region id, e.g. "aws-us-east-1". */
  id: string;
  /** Human-readable name, e.g. "US East 1 (N. Virginia)". */
  name: string;
  /** Cloud provider label used as the name prefix, e.g. "AWS". */
  provider?: string;
  /** Latitude of the datacenter location. */
  lat: number;
  /** Longitude of the datacenter location. */
  lng: number;
  /** Mark a region as unavailable; the marker and option render dimmed. */
  disabled?: boolean;
}

export type RegionSelectProps = Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  /** Regions to plot and list; order drives the select. */
  regions: ServerRegion[];
  /** Controlled selected region id. */
  value?: string;
  /** Uncontrolled initial region id. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Placeholder shown in the select before a region is chosen. */
  placeholder?: string;
  /** Hide the select under the map; markers become the only input. */
  hideSelect?: boolean;
  /** Hide the floating region card on the map. */
  hideCard?: boolean;
  /** Extra content rendered inside the region card, e.g. a latency badge. */
  cardSuffix?: ReactNode;
  /** Measured round-trips by region id, e.g. from useRegionPing. */
  latencies?: Record<string, number | null | undefined>;
};

/** Full display label: provider prefix plus region name. */
const regionLabel = (region: ServerRegion) =>
  region.provider ? `${region.provider} ${region.name}` : region.name;

/** Equirectangular position of a lat/lng pair as percentages of the map. */
const project = (lat: number, lng: number) => ({
  left: ((lng + 180) / 360) * 100,
  top: ((MAP_LAT_MAX - lat) / (MAP_LAT_MAX - MAP_LAT_MIN)) * 100,
});

/* ─────────────────────────────────────────────────────────
 * REGION CARD PLACEMENT
 *
 * The card anchors beside the selected marker and flips
 * quadrant so it always grows toward the map's center —
 * never covering the marker, never clipping at an edge.
 * ───────────────────────────────────────────────────────── */
const cardAnchor = (region: ServerRegion) => {
  const { left, top } = project(region.lat, region.lng);
  const LEFT_HALF = 50;

  return {
    ...(left <= LEFT_HALF ? { left: `${left}%` } : { right: `${100 - left}%` }),
    top: `${top}%`,
  };
};

const cardPlacement = (region: ServerRegion) => {
  const { left, top } = project(region.lat, region.lng);
  const HALF = 50;
  const vertical = top <= HALF ? "mt-3" : "-translate-y-full -mt-3";
  const horizontal = left <= HALF ? "ml-2" : "mr-2";

  return cn(vertical, horizontal);
};

/* ─────────────────────────────────────────────────────────
 * DOT MAP
 *
 * The land bitmap renders once to a canvas sized to the
 * container (device-pixel aware), in the current value of
 * `color` — so the map re-inks itself on theme flips via a
 * class observer, and never ships thousands of DOM nodes.
 * ───────────────────────────────────────────────────────── */
const DOT_RADIUS_RATIO = 0.32;

const drawMap = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  const width = canvas.clientWidth;

  if (!(context && width)) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const cell = width / MAP_COLS;
  const height = cell * MAP_ROWS;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  context.scale(dpr, dpr);
  context.clearRect(0, 0, width, height);
  context.fillStyle = getComputedStyle(canvas).color;

  const radius = cell * DOT_RADIUS_RATIO;
  const TAU = Math.PI * 2;

  for (let row = 0; row < MAP_ROWS; row += 1) {
    const bits = decodeRow(MAP_BITS[row] ?? "");
    const cy = (row + 0.5) * cell;

    for (let col = 0; col < MAP_COLS; col += 1) {
      if (bits[col]) {
        context.beginPath();
        context.arc((col + 0.5) * cell, cy, radius, 0, TAU);
        context.fill();
      }
    }
  }
};

const DotMap = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;

    if (!canvas) {
      return;
    }

    const redraw = () => drawMap(canvas);

    redraw();

    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);

    // Re-ink on theme flips: class-based dark mode toggles on <html>.
    const themeObserver = new MutationObserver(redraw);
    themeObserver.observe(document.documentElement, {
      attributeFilter: ["class", "data-theme", "style"],
      attributes: true,
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="block w-full text-muted-foreground/50"
      data-slot="region-select-map"
      ref={ref}
      style={{ aspectRatio: `${MAP_COLS} / ${MAP_ROWS}` }}
    />
  );
};

/* ─────────────────────────────────────────────────────────
 * MARKERS
 *
 * Each region is a real button on the map: hover or focus
 * lifts a label pill above it, click selects. The selected
 * marker glows primary with a slow ping halo (static under
 * reduced motion). The select below stays the keyboard and
 * screen-reader path, so markers skip roving-focus theater.
 * ───────────────────────────────────────────────────────── */
/** Flips the hover pill away from nearby map edges so it never clips. */
const pillPlacement = (left: number, top: number) => {
  const EDGE = 20;
  const NEAR_TOP = 18;
  const horizontal = (() => {
    if (left <= EDGE) {
      return "-left-1";
    }

    if (left >= 100 - EDGE) {
      return "-right-1";
    }

    return "-translate-x-1/2 left-1/2";
  })();
  const vertical = top <= NEAR_TOP ? "top-full mt-1.5" : "bottom-full mb-1.5";

  return cn(horizontal, vertical);
};

const RegionMarker = ({
  onSelect,
  region,
  selected,
}: {
  onSelect: () => void;
  region: ServerRegion;
  selected: boolean;
}) => {
  const { left, top } = project(region.lat, region.lng);

  return (
    <button
      aria-label={regionLabel(region)}
      aria-pressed={selected}
      className="group -translate-x-1/2 -translate-y-1/2 absolute grid size-6 place-items-center rounded-full outline-none disabled:pointer-events-none disabled:opacity-40"
      data-selected={selected || undefined}
      data-slot="region-select-marker"
      disabled={region.disabled}
      onClick={onSelect}
      style={{ left: `${left}%`, top: `${top}%` }}
      type="button"
    >
      {selected ? (
        <span
          aria-hidden="true"
          className="absolute size-3 rounded-full bg-primary/60 motion-safe:animate-ping"
        />
      ) : null}
      <span
        className={cn(
          "relative size-2 rounded-full transition-[background-color,box-shadow,transform] duration-150",
          selected
            ? "bg-primary shadow-[0_0_10px_2px_var(--color-primary)]"
            : "bg-muted-foreground/70 group-hover:scale-125 group-hover:bg-foreground group-focus-visible:scale-125 group-focus-visible:bg-foreground"
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute z-10 hidden whitespace-nowrap rounded-md bg-popover px-2 py-1 text-popover-foreground text-xs ring-1 ring-border/60 group-focus-visible:block group-hover:block",
          pillPlacement(left, top)
        )}
        role="presentation"
      >
        {region.name}
        <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
          {region.id}
        </span>
      </span>
      <span className="absolute inset-0 rounded-full ring-primary/50 group-focus-visible:ring-2" />
    </button>
  );
};

export const RegionSelect = ({
  cardSuffix,
  className,
  defaultValue,
  hideCard,
  hideSelect,
  latencies,
  onValueChange,
  placeholder = "Select region",
  regions,
  value,
  ...props
}: RegionSelectProps) => {
  const [internal, setInternal] = useState(defaultValue);
  const selectedId = value ?? internal;
  const selected = regions.find((region) => region.id === selectedId);
  const selectedPing = selectedId ? latencies?.[selectedId] : undefined;

  const select = (next: string) => {
    setInternal(next);
    onValueChange?.(next);
  };

  const items = useMemo(
    () =>
      regions.map((region) => ({
        label: regionLabel(region),
        value: region.id,
      })),
    [regions]
  );

  return (
    <div
      className={cn("flex w-full flex-col gap-3", className)}
      data-slot="region-select"
      {...props}
    >
      <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card/40 p-3">
        <DotMap />
        <div className="absolute inset-3">
          {regions.map((region) => (
            <RegionMarker
              key={region.id}
              onSelect={() => select(region.id)}
              region={region}
              selected={region.id === selectedId}
            />
          ))}
        </div>

        {hideCard || !selected ? null : (
          <RegionCard
            className={cn(
              "pointer-events-none absolute max-w-[75%]",
              cardPlacement(selected)
            )}
            key={selected.id}
            ping={selectedPing}
            regionId={selected.id}
            style={cardAnchor(selected)}
            title={regionLabel(selected)}
          >
            {cardSuffix}
          </RegionCard>
        )}
      </div>

      {hideSelect ? null : (
        <Select
          items={items}
          onValueChange={(next) => {
            if (typeof next === "string") {
              select(next);
            }
          }}
          value={selectedId ?? null}
        >
          <SelectTrigger
            aria-label="Region"
            className="w-full"
            data-slot="region-select-trigger"
          >
            <SelectValue>
              {selected ? (
                regionLabel(selected)
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {regions.map((region) => (
              <SelectItem
                disabled={region.disabled}
                key={region.id}
                value={region.id}
              >
                {regionLabel(region)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
