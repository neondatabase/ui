"use client";

/*
 * NeonAurora: the neon.com hero as a live WebGL surface — clusters of
 * thin vertical bars in green/teal/blue twinkling on black. A brand
 * background for heroes, empty workspaces, and marketing moments.
 * Static single frame under reduced motion. GLSL lives in
 * neon-aurora-shader.ts.
 */

import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { AURORA_FRAGMENT, AURORA_VERTEX } from "./neon-aurora-shader";

export type NeonAuroraProps = Omit<ComponentProps<"canvas">, "children"> & {
  /** Animation speed multiplier; 0 freezes the field. */
  speed?: number;
  /** 0-1 share of bar clusters alive at once. */
  density?: number;
  /** Overall brightness multiplier. */
  intensity?: number;
  /** 0-1 depth-of-field blur on the near layer as it approaches. */
  blur?: number;
  /** 0-1 ambient bloom fog hanging around the lit regions. */
  glare?: number;
  /** 0-1 how often the warm flare ignites; 0 disables it. */
  flare?: number;
  /** 0-1 how much of its column each bar fills. */
  thickness?: number;
  /** 0-1 how often the hot white flare ignites; 0 disables it. */
  whiteFlare?: number;
  /** Bar palette, mixed per bar: [deep, primary, accent]. */
  colors?: [string, string, string];
};

/**
 * Seconds for a dial change to close ~63% of its gap — uniforms ease
 * toward their targets each frame, so a dragged slider glides
 * instead of snapping.
 */
const SMOOTH_TAU = 0.12;

const DEFAULT_COLORS: [string, string, string] = [
  "#0e5f45",
  "#00e599",
  "#3b82f6",
];

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

export const NeonAurora = ({
  blur = 1,
  className,
  colors = DEFAULT_COLORS,
  density = 0.2,
  flare = 0.75,
  glare = 0.2,
  intensity = 2,
  speed = 0.7,
  thickness = 0,
  whiteFlare = 0.6,
  ...props
}: NeonAuroraProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Shader time, accumulated frame by frame so a speed change scales
  // the flow from here instead of teleporting the whole field.
  const phaseRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  // Smoothed dial values, persisting across prop-driven re-inits.
  const smoothedRef = useRef<Record<string, number> | null>(null);
  const [deep, primary, accent] = colors;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: false });

    if (!(canvas && gl)) {
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, AURORA_VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, AURORA_FRAGMENT);
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
    const uDensity = gl.getUniformLocation(program, "u_density");
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uBlur = gl.getUniformLocation(program, "u_blur");
    const uGlare = gl.getUniformLocation(program, "u_glare");
    const uFlare = gl.getUniformLocation(program, "u_flare");
    const uThickness = gl.getUniformLocation(program, "u_thickness");
    const uWhiteFlare = gl.getUniformLocation(program, "u_white_flare");

    const targets: Record<string, number> = {
      blur,
      density,
      flare,
      glare,
      intensity,
      speed,
      thickness,
      whiteFlare,
    };

    smoothedRef.current ??= { ...targets };
    const smoothed = smoothedRef.current;

    /** Ease every dial toward its target and upload; k=1 snaps. */
    const applyUniforms = (k: number) => {
      for (const key of Object.keys(targets)) {
        const current = smoothed[key] ?? targets[key] ?? 0;
        smoothed[key] = current + ((targets[key] ?? 0) - current) * k;
      }

      gl.uniform1f(uWhiteFlare, smoothed.whiteFlare ?? whiteFlare);
      gl.uniform1f(uThickness, smoothed.thickness ?? thickness);
      gl.uniform1f(uFlare, smoothed.flare ?? flare);
      gl.uniform1f(uDensity, smoothed.density ?? density);
      gl.uniform1f(uIntensity, smoothed.intensity ?? intensity);
      gl.uniform1f(uBlur, smoothed.blur ?? blur);
      gl.uniform1f(uGlare, smoothed.glare ?? glare);
    };

    for (const [name, css] of [
      ["u_color1", deep],
      ["u_color2", primary],
      ["u_color3", accent],
    ] as const) {
      const [r, g, b] = parseColor(css);
      gl.uniform3f(gl.getUniformLocation(program, name), r, g, b);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let staticFrame = false;

    const renderStatic = () => {
      applyUniforms(1);
      gl.uniform1f(uTime, 7);
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
    accent,
    blur,
    deep,
    density,
    flare,
    glare,
    intensity,
    primary,
    speed,
    thickness,
    whiteFlare,
  ]);

  return (
    <canvas
      aria-hidden="true"
      className={cn("size-full", className)}
      data-slot="neon-aurora"
      ref={canvasRef}
      {...props}
    />
  );
};
