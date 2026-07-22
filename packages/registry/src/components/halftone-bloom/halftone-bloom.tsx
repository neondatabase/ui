"use client";

/*
 * HalftoneBloom: a punched-metal halftone screen revealed by soft
 * drifting color lights. The default rig recreates the heritage
 * background (cool teal left, warm amber right overexposing toward
 * cream); pass a custom lights array to recreate any of the neon.com
 * pattern strips or your own rig. Transparent outside the lit rings,
 * so it works over dark and light surfaces alike. Static single frame
 * under reduced motion. The GLSL lives in halftone-bloom-shader.ts.
 */

import { useEffect, useMemo, useRef } from "react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { BLOOM_FRAGMENT, BLOOM_VERTEX } from "./halftone-bloom-shader";

export interface BloomLight {
  /** Light color. */
  color: string;
  /** 0-1 anchor across the width. */
  x: number;
  /** 0-1 anchor up from the bottom. */
  y: number;
  /** Light radius as a share of the width. */
  radius?: number;
  /** Brightness gain. */
  intensity?: number;
  /** 0-1 pull toward the highlight color at the hottest cells. */
  overexpose?: number;
}

export type HalftoneBloomProps = Omit<ComponentProps<"canvas">, "children"> & {
  /** Light drift speed multiplier; 0 freezes the field. */
  speed?: number;
  /** Cell pitch in CSS pixels. */
  gap?: number;
  /** 0-1 punched-hole radius as a share of the cell. */
  holeSize?: number;
  /** Hole offset from the cell center, in cell units. */
  holeOffset?: [number, number];
  /** Overall brightness multiplier. */
  intensity?: number;
  /** 0-1 how far lights wander from their anchors. */
  drift?: number;
  /** The overexposed highlight color. */
  highlight?: string;
  /** The light rig, up to 6 lights. */
  lights?: BloomLight[];
};

const MAX_LIGHTS = 6;

const DEFAULT_HOLE_OFFSET: [number, number] = [-0.09, -0.09];

const DEFAULT_LIGHTS: BloomLight[] = [
  { color: "#1d5e57", radius: 0.25, x: 0.06, y: 0.9 },
  { color: "#1d5e57", intensity: 0.95, radius: 0.21, x: 0.42, y: 0.05 },
  {
    color: "#c4692e",
    intensity: 1.6,
    overexpose: 1,
    radius: 0.27,
    x: 0.92,
    y: 0.45,
  },
  {
    color: "#c4692e",
    intensity: 1.1,
    overexpose: 1,
    radius: 0.19,
    x: 0.78,
    y: 0.08,
  },
];

/**
 * Seconds for a dial change to close ~63% of its gap — uniforms ease
 * toward their targets each frame, so a dragged slider glides
 * instead of snapping.
 */
const SMOOTH_TAU = 0.12;

const parseColor = (css: string): [number, number, number] => {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d");

  if (!context) {
    return [0, 0.9, 0.6];
  }

  context.fillStyle = css;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [(r ?? 0) / 255, (g ?? 0) / 255, (b ?? 0) / 255];
};

const warnDev = (message: string) => {
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(message);
  }
};

const compile = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null => {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    warnDev(
      `neon-ui: shader compile failed: ${gl.getShaderInfoLog(shader) ?? "unknown"}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

export const HalftoneBloom = ({
  className,
  drift = 1,
  gap = 12,
  highlight = "#ecdcae",
  holeOffset = DEFAULT_HOLE_OFFSET,
  holeSize = 0.22,
  intensity = 1,
  lights = DEFAULT_LIGHTS,
  speed = 1,
  ...props
}: HalftoneBloomProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Shader time, accumulated frame by frame so a speed change scales
  // the flow from here instead of teleporting the whole field.
  const phaseRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  // Smoothed dial values, persisting across prop-driven re-inits.
  const smoothedRef = useRef<Record<string, number> | null>(null);
  const [holeX, holeY] = holeOffset;
  const rigKey = useMemo(
    () =>
      lights
        .map(
          (light) =>
            `${light.color}/${light.x}/${light.y}/${light.radius ?? 0.25}/${light.intensity ?? 1}/${light.overexpose ?? 0}`
        )
        .join("|"),
    [lights]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
    });

    if (!(canvas && gl)) {
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, BLOOM_VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, BLOOM_FRAGMENT);
    const program = gl.createProgram();

    if (!(vertex && fragment && program)) {
      if (vertex) {
        gl.deleteShader(vertex);
      }
      if (fragment) {
        gl.deleteShader(fragment);
      }
      return;
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      warnDev(
        `neon-ui: program link failed: ${gl.getProgramInfoLog(program) ?? "unknown"}`
      );
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }

    // oxlint-disable-next-line react/react-compiler -- WebGL method, not a React hook
    gl.useProgram(program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uGap = gl.getUniformLocation(program, "u_gap");
    const uHole = gl.getUniformLocation(program, "u_hole");
    const uHoleOffset = gl.getUniformLocation(program, "u_hole_offset");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uDrift = gl.getUniformLocation(program, "u_drift");
    const uHighlight = gl.getUniformLocation(program, "u_highlight");
    const uCount = gl.getUniformLocation(program, "u_count");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targets: Record<string, number> = {
      gap,
      holeSize,
      intensity,
      speed,
    };

    smoothedRef.current ??= { ...targets };
    const smoothed = smoothedRef.current;

    /** Ease every dial toward its target and upload; k=1 snaps. */
    const applyUniforms = (k: number) => {
      for (const key of Object.keys(targets)) {
        const current = smoothed[key] ?? targets[key] ?? 0;
        smoothed[key] = current + ((targets[key] ?? 0) - current) * k;
      }

      gl.uniform1f(uGap, (smoothed.gap ?? gap) * dpr);
      gl.uniform1f(uHole, smoothed.holeSize ?? holeSize);
      gl.uniform1f(uIntensity, smoothed.intensity ?? intensity);
    };
    gl.uniform2f(uHoleOffset, holeX, holeY);
    gl.uniform1f(uIntensity, intensity);
    gl.uniform1f(uDrift, drift);

    const [hr, hg, hb] = parseColor(highlight);
    gl.uniform3f(uHighlight, hr, hg, hb);

    const rig = lights.slice(0, MAX_LIGHTS);
    const positions = new Float32Array(MAX_LIGHTS * 2);
    const rigColors = new Float32Array(MAX_LIGHTS * 3);
    const radii = new Float32Array(MAX_LIGHTS);
    const gains = new Float32Array(MAX_LIGHTS);
    const overs = new Float32Array(MAX_LIGHTS);

    for (const [index, light] of rig.entries()) {
      const [r, g, b] = parseColor(light.color);
      positions[index * 2] = light.x;
      positions[index * 2 + 1] = light.y;
      rigColors[index * 3] = r;
      rigColors[index * 3 + 1] = g;
      rigColors[index * 3 + 2] = b;
      radii[index] = light.radius ?? 0.25;
      gains[index] = light.intensity ?? 1;
      overs[index] = light.overexpose ?? 0;
    }

    gl.uniform1i(uCount, rig.length);
    gl.uniform2fv(gl.getUniformLocation(program, "u_pos"), positions);
    gl.uniform3fv(gl.getUniformLocation(program, "u_col"), rigColors);
    gl.uniform1fv(gl.getUniformLocation(program, "u_rad"), radii);
    gl.uniform1fv(gl.getUniformLocation(program, "u_gain"), gains);
    gl.uniform1fv(gl.getUniformLocation(program, "u_over"), overs);

    let frame = 0;
    let staticFrame = false;

    const renderStatic = () => {
      applyUniforms(1);
      gl.uniform1f(uTime, 5);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    const observer = new ResizeObserver(() => {
      resize();

      if (staticFrame) {
        renderStatic();
      }
    });
    observer.observe(canvas);
    resize();

    const dispose = () => {
      observer.disconnect();
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };

    const draw = (now: number) => {
      const last = lastFrameRef.current ?? now;
      lastFrameRef.current = now;
      // Skip GL work while hidden: keep the loop alive, drop the cost.
      if (!(canvas.checkVisibility?.() ?? true)) {
        frame = requestAnimationFrame(draw);
        return;
      }

      const dt = (now - last) / 1000;
      applyUniforms(1 - Math.exp(-dt / SMOOTH_TAU));
      phaseRef.current += dt * (smoothed.speed ?? speed);
      gl.uniform1f(uTime, phaseRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduced.matches || speed === 0) {
      staticFrame = true;
      resize();
      renderStatic();
      return dispose;
    }

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      dispose();
    };
    // rigKey covers the lights array contents.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [drift, gap, highlight, holeSize, holeX, holeY, intensity, rigKey, speed]);

  return (
    <canvas
      aria-hidden="true"
      className={cn("size-full", className)}
      data-slot="halftone-bloom"
      ref={canvasRef}
      {...props}
    />
  );
};
