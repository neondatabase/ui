"use client";

/*
 * MeshGradient: the Neon brand-deck gradient as a live WebGL surface —
 * a defocused warm color field (moss, ember, gold, and a yellow-green
 * bloom) drifting over near-black. A brand background for heroes,
 * covers, and marketing moments. Static single frame under reduced
 * motion. GLSL lives in mesh-gradient-shader.ts.
 */

import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { MESH_FRAGMENT, MESH_VERTEX } from "./mesh-gradient-shader";

export type MeshGradientPalette = [
  base: string,
  moss: string,
  ember: string,
  gold: string,
  bloom: string,
];

export type MeshGradientProps = Omit<ComponentProps<"canvas">, "children"> & {
  /** Animation speed multiplier; 0 freezes the field. */
  speed?: number;
  /** 0-1 domain warp — how organic the blob edges get. */
  warp?: number;
  /** 0-1 dither strength; keeps soft falloffs from banding. */
  grain?: number;
  /** Brightness multiplier on the bloom blob. */
  glow?: number;
  /** The field, painted back to front: [base, moss, ember, gold, bloom]. */
  colors?: MeshGradientPalette;
};

const DEFAULT_COLORS: MeshGradientPalette = [
  "#0b0b08",
  "#2c4a33",
  "#a85f1b",
  "#edbf4e",
  "#eef2a0",
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

export const MeshGradient = ({
  className,
  colors = DEFAULT_COLORS,
  glow = 1,
  grain = 0.5,
  speed = 0.6,
  warp = 0.4,
  ...props
}: MeshGradientProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [base, moss, ember, gold, bloom] = colors;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { alpha: false });

    if (!(canvas && gl)) {
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, MESH_VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, MESH_FRAGMENT);
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
    const uWarp = gl.getUniformLocation(program, "u_warp");
    const uGrain = gl.getUniformLocation(program, "u_grain");
    const uGlow = gl.getUniformLocation(program, "u_glow");

    gl.uniform1f(uWarp, warp);
    gl.uniform1f(uGrain, grain);
    gl.uniform1f(uGlow, glow);

    for (const [name, css] of [
      ["u_base", base],
      ["u_moss", moss],
      ["u_ember", ember],
      ["u_gold", gold],
      ["u_bloom", bloom],
    ] as const) {
      const [r, g, b] = parseColor(css);
      gl.uniform3f(gl.getUniformLocation(program, name), r, g, b);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let staticFrame = false;

    const renderStatic = () => {
      gl.uniform1f(uTime, 11);
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
      // Skip GL work while hidden (e.g. behind a docs Code overlay's
      // visibility:hidden panel) — keep the loop alive, drop the cost.
      if (!(canvas.checkVisibility?.() ?? true)) {
        frame = requestAnimationFrame(draw);
        return;
      }

      gl.uniform1f(uTime, (now / 1000) * speed);
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
  }, [base, bloom, ember, glow, gold, grain, moss, speed, warp]);

  return (
    <canvas
      aria-hidden="true"
      className={cn("size-full", className)}
      data-slot="mesh-gradient"
      ref={canvasRef}
      {...props}
    />
  );
};
