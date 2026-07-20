"use client";

import type { GlobeInstance } from "globe.gl";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";

import { pingTone } from "@/components/region-card/region-card";
import {
  decodeRow,
  MAP_BITS,
  MAP_COLS,
  MAP_LAT_MAX,
  MAP_ROWS,
} from "@/components/region-select/map-dots";
import type { ServerRegion } from "@/components/region-select/region-select";
import { cn } from "@/lib/utils";

export type RegionGlobeVariant = "relief" | "dots" | "outlines";

export type RegionGlobeProps = Omit<ComponentProps<"div">, "children"> & {
  /** Regions rendered as clickable marker dots on the globe. */
  regions: ServerRegion[];
  /** Region id the camera flies to; its marker renders larger. */
  value?: string;
  /** Called with a region id when its marker dot is clicked. */
  onValueChange?: (value: string) => void;
  /** Measured round-trips by region id; shown in the marker popover. */
  latencies?: Record<string, number | null | undefined>;
  /** Keep the globe slowly turning, e.g. until the user picks. */
  spin?: boolean;
  /** Camera latitude lead in degrees; a slight downward tilt. */
  tilt?: number;
  /** Grayscale surface texture; defaults to the Natural Earth topology map. */
  textureUrl?: string;
  /** Height map for the relief; defaults to the same topology map. */
  bumpUrl?: string;
  /**
   * Land treatment: "relief" (monochrome height map), "dots"
   * (the house dot-matrix bitmap), or "outlines" (country borders).
   */
  variant?: RegionGlobeVariant;
  /** Set false to remove the atmosphere glow entirely. */
  glow?: boolean;
  /** Glow color; defaults to the theme's primary token. */
  glowColor?: string;
  /** Glow reach as a fraction of the globe radius. */
  glowAltitude?: number;
  /** Country borders GeoJSON for the outlines variant. */
  countriesUrl?: string;
};

const CAMERA_ALTITUDE = 2.1;
const FLY_MS = 900;
const IDLE_SPIN_SPEED = 0.9;
const DARK_LUMA_SUM = 382;

/* Travel arcs (after globe.gl's emit-arcs-on-click example): an arc
 * dashes from the previous region to the new one while rings ripple
 * out of both endpoints. */
const ARC_REL_LEN = 0.4;
const TRAVEL_RINGS_MAX_R = 4;
const TRAVEL_RING_SPEED = 4;
const TRAVEL_RING_REPEAT_MS = (FLY_MS * ARC_REL_LEN) / 3;

/** Grayscale Natural Earth topology, doubling as texture + bump. */
const TOPOLOGY_URL =
  "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png";

/** Natural Earth 110m country borders (globe.gl's example dataset). */
const COUNTRIES_URL =
  "https://globe.gl/example/datasets/ne_110m_admin_0_countries.geojson";

const LAND_DOT_RADIUS = 0.38;
const OUTLINE_ALTITUDE = 0.004;
const DEFAULT_GLOW_ALTITUDE = 0.12;

interface LandDot {
  lat: number;
  lng: number;
}

let landDotsCache: LandDot[] | null = null;

/** The RegionSelect land bitmap, lifted onto the sphere as dots. */
const landDots = (): LandDot[] => {
  if (landDotsCache) {
    return landDotsCache;
  }

  const step = 360 / MAP_COLS;
  const dots: LandDot[] = [];

  for (let row = 0; row < MAP_ROWS; row += 1) {
    const flags = decodeRow(MAP_BITS[row] ?? "");
    const lat = MAP_LAT_MAX - (row + 0.5) * step;

    for (let col = 0; col < MAP_COLS; col += 1) {
      if (flags[col]) {
        dots.push({ lat, lng: -180 + (col + 0.5) * step });
      }
    }
  }

  landDotsCache = dots;
  return dots;
};

const countriesCache = new Map<string, Promise<object[]>>();

/** Fetches (and caches) the country features for the outlines variant. */
const loadCountries = (url: string): Promise<object[]> => {
  const cached = countriesCache.get(url);

  if (cached) {
    return cached;
  }

  const load = async (): Promise<object[]> => {
    try {
      const response = await fetch(url);
      const geojson = (await response.json()) as { features?: object[] };

      return geojson.features ?? [];
    } catch {
      return [];
    }
  };

  const promise = load();

  countriesCache.set(url, promise);
  return promise;
};

/** Parses any CSS color to 0-255 RGB via a canvas round-trip. */
const parseRgb = (raw: string): [number, number, number] => {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return [128, 128, 128];
  }

  context.fillStyle = raw;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;

  return [r ?? 0, g ?? 0, b ?? 0];
};

const lumaSum = (raw: string) => {
  const [r, g, b] = parseRgb(raw);
  return r + g + b;
};

/** Resolved theme colors, probed from hidden token spans. */
const probeTheme = (root: HTMLElement) => {
  const colorOf = (selector: string) => {
    const element = root.querySelector(selector);
    return element ? getComputedStyle(element).color : "";
  };
  const glow = colorOf(".probe-glow");

  return {
    dark: lumaSum(glow) < DARK_LUMA_SUM,
    dot: colorOf(".probe-base"),
    marker: colorOf(".probe-marker"),
    sphere: glow,
  };
};

/* ─────────────────────────────────────────────────────────
 * GLOBE STORYBOARD
 *
 * A Three.js globe (globe.gl) with a monochrome relief — the
 * topology map as texture + bump, tinted by muted-foreground.
 * Region markers are real DOM buttons pinned to the surface
 * (same altitude as arc/ring endpoints, so travel effects
 * land exactly on the dots). Picking a region flies the
 * camera on a tilt while a dashed arc + rings travel from
 * the previous region. Colors re-probe on theme flips, and
 * reduced motion disables spin, flight, and travel.
 * ───────────────────────────────────────────────────────── */
export const RegionGlobe = ({
  bumpUrl = TOPOLOGY_URL,
  className,
  countriesUrl = COUNTRIES_URL,
  glow = true,
  glowAltitude = DEFAULT_GLOW_ALTITUDE,
  glowColor,
  latencies,
  onValueChange,
  regions,
  spin = false,
  textureUrl = TOPOLOGY_URL,
  tilt = 12,
  value,
  variant = "relief",
  ...props
}: RegionGlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const sceneRef = useRef({
    bumpUrl,
    countriesUrl,
    glow,
    glowAltitude,
    glowColor,
    latencies,
    onValueChange,
    regions,
    spin,
    textureUrl,
    tilt,
    value,
    variant,
  });
  const syncRef = useRef<((transitionMs: number) => void) | null>(null);
  const pingSyncRef = useRef<(() => void) | null>(null);
  const themeSyncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    sceneRef.current = {
      bumpUrl,
      countriesUrl,
      glow,
      glowAltitude,
      glowColor,
      latencies,
      onValueChange,
      regions,
      spin,
      textureUrl,
      tilt,
      value,
      variant,
    };
  });

  // Build once (dynamic import keeps SSR clean), then keep the
  // instance and mutate it from the sync effects below.
  useEffect(() => {
    const stage = stageRef.current;
    const probe = probeRef.current;

    if (!(stage && probe)) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let themeObserver: MutationObserver | null = null;
    let markerRgb: [number, number, number] = [128, 128, 128];
    let lastTravelId = sceneRef.current.value;
    const timeouts = new Set<number>();

    const schedule = (run: () => void, delay: number) => {
      const timeout = window.setTimeout(() => {
        timeouts.delete(timeout);
        run();
      }, delay);
      timeouts.add(timeout);
    };

    /** Nearest ancestor that would clip the pill. */
    const clipAncestorOf = (element: HTMLElement) => {
      let node = element.parentElement;

      while (node && node !== document.body) {
        const { overflow, overflowX, overflowY } = getComputedStyle(node);

        if (/hidden|clip|auto|scroll/u.test(overflow + overflowX + overflowY)) {
          return node;
        }

        node = node.parentElement;
      }

      return null;
    };

    /** Flips the pill below the dot and shifts it inward when the
     * default above-centered spot would clip at a panel edge. */
    const placePill = (button: HTMLButtonElement) => {
      const pill = button.querySelector("[data-pill]");
      const clip = clipAncestorOf(button);

      if (!(pill instanceof HTMLElement && clip)) {
        return;
      }

      requestAnimationFrame(() => {
        const pillRect = pill.getBoundingClientRect();
        const clipRect = clip.getBoundingClientRect();
        const PAD = 6;

        if (pillRect.top < clipRect.top + PAD) {
          pill.style.bottom = "auto";
          pill.style.top = "100%";
          pill.style.marginBottom = "0";
          pill.style.marginTop = "0.375rem";
        }

        let shift = 0;

        if (pillRect.left < clipRect.left + PAD) {
          shift = clipRect.left + PAD - pillRect.left;
        } else if (pillRect.right > clipRect.right - PAD) {
          shift = clipRect.right - PAD - pillRect.right;
        }

        if (shift !== 0) {
          pill.style.transform = `translateX(calc(-50% + ${shift}px))`;
        }
      });
    };

    const makeMarker = (region: ServerRegion) => {
      const button = document.createElement("button");

      button.type = "button";
      button.tabIndex = -1;
      button.setAttribute("aria-hidden", "true");
      button.dataset.slot = "region-globe-marker";
      // No self-centering transform: globe.gl's CSS2D layer already
      // anchors the element's center on the coordinate — adding our
      // own -50% translate double-shifts dots off arcs and rings.
      button.className =
        "group pointer-events-auto grid size-5 cursor-pointer place-items-center rounded-full disabled:pointer-events-none disabled:opacity-40";
      button.disabled = Boolean(region.disabled);
      const label = region.provider
        ? `${region.provider} ${region.name}`
        : region.name;
      button.innerHTML =
        '<span data-halo class="absolute hidden size-3 rounded-full bg-primary/60 [animation-iteration-count:3] motion-safe:animate-ping"></span>' +
        '<span data-dot class="relative size-2 rounded-full bg-primary transition-transform duration-150 group-hover:scale-125"></span>' +
        '<span data-pill class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-left text-popover-foreground text-xs ring-1 ring-border/60 group-hover:block">' +
        `${label}` +
        `<span class="block font-mono text-[10px] text-muted-foreground">${region.id}` +
        '<span data-ping class="ml-1 font-mono text-[10px]"></span>' +
        "</span></span>";
      button.addEventListener("click", () => {
        sceneRef.current.onValueChange?.(region.id);
      });
      button.addEventListener("mouseenter", () => {
        placePill(button);

        // Freeze the idle spin while aiming — targets must not slide
        // out from under the pointer.
        const controls = globeRef.current?.controls();

        if (controls) {
          controls.autoRotate = false;
        }
      });
      button.addEventListener("mouseleave", () => {
        const pill = button.querySelector("[data-pill]");

        if (pill instanceof HTMLElement) {
          pill.removeAttribute("style");
        }

        const controls = globeRef.current?.controls();

        if (controls) {
          controls.autoRotate = sceneRef.current.spin && !reduceMotion;
        }
      });
      markerRefs.current.set(region.id, button);

      return button;
    };

    const applyTheme = () => {
      const globe = globeRef.current;

      if (!globe) {
        return;
      }

      const scene = sceneRef.current;
      const theme = probeTheme(probe);
      const material = globe.globeMaterial() as {
        color?: { set: (color: string) => void };
        opacity?: number;
        transparent?: boolean;
      };

      material.transparent = true;

      if (scene.variant === "relief") {
        // The grayscale relief is tinted by muted-foreground: light
        // relief on dark themes, dark relief on light — always B&W.
        material.opacity = theme.dark ? 0.9 : 0.96;
        material.color?.set(theme.dot);
      } else {
        // Dots and outlines sit on a plain sphere in the surface tone.
        material.opacity = theme.dark ? 0.72 : 0.94;
        material.color?.set(theme.sphere);
      }

      markerRgb = parseRgb(theme.marker);
      globe
        .showAtmosphere(scene.glow)
        .atmosphereColor(scene.glowColor ?? theme.marker)
        .atmosphereAltitude(scene.glowAltitude)
        .pointColor(() => theme.dot)
        .polygonStrokeColor(() => theme.dot);
    };

    const applySize = () => {
      const globe = globeRef.current;
      const width = stage.clientWidth;

      if (globe && width) {
        globe.width(width).height(width);
      }
    };

    /** One dashed arc + ripple rings from the previous region. */
    const emitTravel = (from: ServerRegion, to: ServerRegion) => {
      const globe = globeRef.current;

      if (!globe || reduceMotion) {
        return;
      }

      const arc = {
        endLat: to.lat,
        endLng: to.lng,
        startLat: from.lat,
        startLng: from.lng,
      };

      globe.arcsData([...globe.arcsData(), arc]);
      // Die right as the pulse lands — a lingering arc restarts its
      // dash cycle and reads as a second, phantom trip.
      schedule(
        () => {
          globe.arcsData(globe.arcsData().filter((d) => d !== arc));
        },
        FLY_MS * (1 + ARC_REL_LEN)
      );

      const emitRings = (lat: number, lng: number) => {
        const ring = { lat, lng };

        globe.ringsData([...globe.ringsData(), ring]);
        schedule(() => {
          globe.ringsData(globe.ringsData().filter((d) => d !== ring));
        }, FLY_MS * ARC_REL_LEN);
      };

      emitRings(from.lat, from.lng);
      schedule(() => emitRings(to.lat, to.lng), FLY_MS);
    };

    const syncSelection = (transitionMs: number) => {
      const globe = globeRef.current;
      const scene = sceneRef.current;
      const selected = scene.regions.find(
        (region) => region.id === scene.value
      );

      if (selected && scene.value !== lastTravelId) {
        const from = scene.regions.find((region) => region.id === lastTravelId);

        lastTravelId = scene.value;

        if (from && transitionMs > 0) {
          emitTravel(from, selected);
        }
      }

      for (const [id, element] of markerRefs.current) {
        const isSelected = id === scene.value;
        const halo = element.querySelector("[data-halo]");
        const dot = element.querySelector("[data-dot]");

        halo?.classList.toggle("hidden", !isSelected);
        dot?.classList.toggle("scale-125", isSelected);
        dot?.classList.toggle("bg-primary", isSelected);
        dot?.classList.toggle("bg-muted-foreground", !isSelected);
      }

      if (globe && selected && !scene.spin) {
        globe.pointOfView(
          {
            altitude: CAMERA_ALTITUDE,
            lat: selected.lat - scene.tilt,
            lng: selected.lng,
          },
          reduceMotion ? 0 : transitionMs
        );
      }
    };

    const build = async () => {
      const { default: Globe } = await import("globe.gl");

      if (disposed) {
        return;
      }

      const globe = new Globe(stage, {
        animateIn: false,
        rendererConfig: { alpha: true, antialias: true },
      });

      globeRef.current = globe;
      globe
        .backgroundColor("rgba(0,0,0,0)")
        .showGlobe(true)
        .showGraticules(false)
        .arcColor(() => `rgb(${markerRgb.join(",")})`)
        .arcDashLength(ARC_REL_LEN)
        .arcDashGap(2)
        .arcDashInitialGap(1)
        .arcDashAnimateTime(FLY_MS)
        .arcsTransitionDuration(0)
        .arcStroke(0.35)
        .ringColor(() => (t: number) => `rgba(${markerRgb.join(",")},${1 - t})`)
        .ringMaxRadius(TRAVEL_RINGS_MAX_R)
        .ringPropagationSpeed(TRAVEL_RING_SPEED)
        .ringRepeatPeriod(TRAVEL_RING_REPEAT_MS)
        .htmlElementsData(sceneRef.current.regions)
        .htmlLat((d) => (d as ServerRegion).lat)
        .htmlLng((d) => (d as ServerRegion).lng)
        .htmlAltitude(0.002)
        .htmlTransitionDuration(0)
        // Occlusion: markers on the far hemisphere fade out instead of
        // floating ghost-like over the dark side of the sphere.
        .htmlElementVisibilityModifier((element, isVisible) => {
          element.style.opacity = isVisible ? "1" : "0";
          element.style.pointerEvents = isVisible ? "" : "none";
          element.style.transition = "opacity 150ms ease";
        })
        .htmlElement((d) => makeMarker(d as ServerRegion));

      // Land treatment per variant.
      const { variant: landVariant } = sceneRef.current;

      if (landVariant === "dots") {
        globe
          .pointsData(landDots())
          .pointsMerge(true)
          .pointAltitude(0.002)
          .pointRadius(LAND_DOT_RADIUS);
      } else if (landVariant === "outlines") {
        globe
          .polygonCapColor(() => "rgba(0,0,0,0)")
          .polygonSideColor(() => "rgba(0,0,0,0)")
          .polygonAltitude(OUTLINE_ALTITUDE)
          .polygonsTransitionDuration(0);
        void (async () => {
          const features = await loadCountries(sceneRef.current.countriesUrl);

          if (!disposed && globeRef.current === globe) {
            globe.polygonsData(features);
          }
        })();
      } else {
        globe
          .globeImageUrl(sceneRef.current.textureUrl)
          .bumpImageUrl(sceneRef.current.bumpUrl);
      }

      const controls = globe.controls();

      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = sceneRef.current.spin && !reduceMotion;
      controls.autoRotateSpeed = IDLE_SPIN_SPEED;

      applySize();
      applyTheme();
      syncSelection(0);
      pingSyncRef.current?.();

      resizeObserver = new ResizeObserver(applySize);
      resizeObserver.observe(stage);
      themeObserver = new MutationObserver(applyTheme);
      themeObserver.observe(document.documentElement, {
        attributeFilter: ["class", "data-theme", "style"],
        attributes: true,
      });
    };

    const syncPings = () => {
      for (const [id, element] of markerRefs.current) {
        const ping = sceneRef.current.latencies?.[id];
        const target = element.querySelector("[data-ping]");

        if (target instanceof HTMLElement) {
          if (typeof ping === "number") {
            target.textContent = `· ping: ${ping} ms`;
            target.className = `ml-1 font-mono text-[10px] ${pingTone(ping)}`;
          } else {
            target.textContent = "";
          }
        }
      }
    };

    syncRef.current = syncSelection;
    pingSyncRef.current = syncPings;
    themeSyncRef.current = applyTheme;

    void build();

    const markers = markerRefs.current;

    return () => {
      disposed = true;

      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }

      timeouts.clear();
      resizeObserver?.disconnect();
      themeObserver?.disconnect();
      markers.clear();
      globeRef.current?._destructor();
      globeRef.current = null;
    };
  }, []);

  // Selection changed: restyle markers and fly the camera.
  useEffect(() => {
    syncRef.current?.(FLY_MS);
  }, [value, regions]);

  // Glow knobs changed: re-apply theme-driven config in place.
  useEffect(() => {
    themeSyncRef.current?.();
  }, [glow, glowColor, glowAltitude]);

  // Fresh latencies: rewrite the popover ping lines in place.
  useEffect(() => {
    pingSyncRef.current?.();
  }, [latencies]);

  // Spin toggled: hand control between idle rotation and the camera.
  useEffect(() => {
    const controls = globeRef.current?.controls();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (controls) {
      controls.autoRotate = spin && !reduceMotion;
    }

    if (!spin) {
      syncRef.current?.(FLY_MS);
    }
  }, [spin]);

  return (
    <div
      className={cn("relative w-full", className)}
      data-slot="region-globe"
      ref={containerRef}
      {...props}
    >
      <div aria-hidden="true" className="hidden" ref={probeRef}>
        <span className="probe-base text-muted-foreground" />
        <span className="probe-glow text-background" />
        <span className="probe-marker text-primary" />
      </div>
      <div
        aria-hidden="true"
        className="aspect-square w-full [&_canvas]:!h-full [&_canvas]:!w-full [&_div]:!overflow-visible"
        ref={stageRef}
      />
    </div>
  );
};
