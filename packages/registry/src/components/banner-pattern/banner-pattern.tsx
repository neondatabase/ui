"use client";

/*
 * BannerPattern: neon.com's banner dot pattern as a live WebGL
 * surface — a square-dot grid masking a drifting color field, so
 * every dot samples the green-to-amber glow behind it. A brand
 * background for banners, cards, and covers. Static single frame
 * under reduced motion. GLSL lives in banner-pattern-shader.ts.
 */

import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { BANNER_FRAGMENT, BANNER_VERTEX } from "./banner-pattern-shader";

export type BannerPatternPalette = [
  base: string,
  green: string,
  sage: string,
  amber: string,
  cream: string,
  rust: string,
];

export type BannerPatternProps = Omit<ComponentProps<"canvas">, "children"> & {
  /** Animation speed multiplier; 0 freezes the field. */
  speed?: number;
  /** Grid cell size in CSS pixels. */
  cell?: number;
  /** 0-0.5 dot half-width as a fraction of the cell. */
  dotSize?: number;
  /** 0-1 unmasked ambient glow behind the dots. */
  haze?: number;
  /** 0-1 per-dot brightness variance. */
  jitter?: number;
  /** The field, painted back to front: [base, green, sage, amber, cream, rust]. */
  colors?: BannerPatternPalette;
};

/**
 * Seconds for a dial or palette change to close ~63% of its gap —
 * uniforms ease toward their targets each frame, so a dragged slider
 * or a palette switch glides instead of snapping.
 */
const SMOOTH_TAU = 0.12;

const DEFAULT_COLORS: BannerPatternPalette = [
  "#0a0b09",
  "#34d59a",
  "#97b47d",
  "#feaa2c",
  "#ffeacc",
  "#b03323",
];

const parseColor = (css: string): [number, number, number] => {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d");

  if (!context) {
    return [0, 0, 0];
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

export const BannerPattern = ({
  cell = 8,
  className,
  colors = DEFAULT_COLORS,
  dotSize = 0.14,
  haze = 0.5,
  jitter = 0.35,
  speed = 0.5,
  ...props
}: BannerPatternProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Shader time, accumulated frame by frame so a speed change scales
  // the flow from here instead of teleporting the whole field.
  const phaseRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  // Smoothed uniform values, persisting across prop-driven re-inits.
  const smoothedRef = useRef<Record<string, number> | null>(null);
  const [base, green, sage, amber, cream, rust] = colors;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: false });

    if (!(canvas && gl)) {
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, BANNER_VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, BANNER_FRAGMENT);
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

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uCell = gl.getUniformLocation(program, "u_cell");
    const uDot = gl.getUniformLocation(program, "u_dot");
    const uHaze = gl.getUniformLocation(program, "u_haze");
    const uJitter = gl.getUniformLocation(program, "u_jitter");

    const palette = [
      ["u_base", base],
      ["u_green", green],
      ["u_sage", sage],
      ["u_amber", amber],
      ["u_cream", cream],
      ["u_rust", rust],
    ] as const;

    const targets: Record<string, number> = {
      cell,
      dotSize,
      haze,
      jitter,
      speed,
    };

    for (const [name, css] of palette) {
      const [r, g, b] = parseColor(css);
      targets[`${name}_r`] = r;
      targets[`${name}_g`] = g;
      targets[`${name}_b`] = b;
    }

    smoothedRef.current ??= { ...targets };
    const smoothed = smoothedRef.current;
    const colorLocations = palette.map(([name]) =>
      gl.getUniformLocation(program, name)
    );

    /** Ease every uniform toward its target and upload; k=1 snaps. */
    const applyUniforms = (k: number) => {
      for (const key of Object.keys(targets)) {
        const current = smoothed[key] ?? targets[key] ?? 0;
        smoothed[key] = current + ((targets[key] ?? 0) - current) * k;
      }

      gl.uniform1f(uCell, (smoothed.cell ?? cell) * dpr);
      gl.uniform1f(uDot, smoothed.dotSize ?? dotSize);
      gl.uniform1f(uHaze, smoothed.haze ?? haze);
      gl.uniform1f(uJitter, smoothed.jitter ?? jitter);

      for (const [index, [name]] of palette.entries()) {
        gl.uniform3f(
          colorLocations[index] ?? null,
          smoothed[`${name}_r`] ?? 0,
          smoothed[`${name}_g`] ?? 0,
          smoothed[`${name}_b`] ?? 0
        );
      }
    };

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
      // Skip GL work while hidden (e.g. behind a docs Code overlay's
      // visibility:hidden panel) — keep the loop alive, drop the cost.
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
  }, [
    amber,
    base,
    cell,
    cream,
    dotSize,
    green,
    haze,
    jitter,
    rust,
    sage,
    speed,
  ]);

  return (
    <canvas
      aria-hidden="true"
      className={cn("size-full", className)}
      data-slot="banner-pattern"
      ref={canvasRef}
      {...props}
    />
  );
};
