"use client";

/*
 * DotMatrixWave: a field of dots breathing in a smooth noise wave,
 * the RegionSelect dot-map aesthetic, generalized into a background
 * surface. Color comes from currentColor at mount (same contract as
 * NeonLoader and AnimatedWash), so a text-primary ancestor or the
 * theme drives it with zero props; pass a colors array for a
 * left-to-right gradient fade instead, like the neon.com green-to-
 * blue type treatment. Static single frame under reduced motion.
 * The GLSL lives in dot-matrix-wave-shader.ts.
 */

import { useEffect, useMemo, useRef } from "react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { DOT_FRAGMENT, DOT_VERTEX } from "./dot-matrix-wave-shader";

export type DotMatrixWaveProps = Omit<ComponentProps<"canvas">, "children"> & {
  /** Wave drift speed multiplier; 0 freezes the field. */
  speed?: number;
  /** Dot pitch in CSS pixels. */
  gap?: number;
  /** 0-1 dot radius as a share of the pitch. */
  dotSize?: number;
  /** 0-1 how hard the wave swells the dots. */
  amplitude?: number;
  /** 0-1 minimum brightness of resting dots. */
  floor?: number;
  /**
   * Gradient stops spread evenly left to right, up to 6. Omit to
   * paint the whole field with currentColor.
   */
  colors?: string[];
};

const MAX_STOPS = 6;

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

export const DotMatrixWave = ({
  amplitude = 0.8,
  className,
  colors,
  dotSize = 0.35,
  floor = 0.08,
  gap = 14,
  speed = 1,
  ...props
}: DotMatrixWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopsKey = useMemo(() => colors?.join("|") ?? "", [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
    });

    if (!(canvas && gl)) {
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, DOT_VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, DOT_FRAGMENT);
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
    const uDot = gl.getUniformLocation(program, "u_dot");
    const uAmplitude = gl.getUniformLocation(program, "u_amplitude");
    const uFloor = gl.getUniformLocation(program, "u_floor");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // The gradient: explicit stops, or currentColor as a single stop.
    const stops =
      colors && colors.length > 0
        ? colors.slice(0, MAX_STOPS).map(parseColor)
        : [parseColor(getComputedStyle(canvas).color)];
    const stopData = new Float32Array(MAX_STOPS * 3);

    for (const [index, [r, g, b]] of stops.entries()) {
      stopData[index * 3] = r;
      stopData[index * 3 + 1] = g;
      stopData[index * 3 + 2] = b;
    }

    gl.uniform1i(gl.getUniformLocation(program, "u_stop_count"), stops.length);
    gl.uniform3fv(gl.getUniformLocation(program, "u_stops"), stopData);
    gl.uniform1f(uGap, gap * dpr);
    gl.uniform1f(uDot, dotSize);
    gl.uniform1f(uAmplitude, amplitude);
    gl.uniform1f(uFloor, floor);

    let frame = 0;
    let staticFrame = false;

    const renderStatic = () => {
      gl.uniform1f(uTime, 3);
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
      // Skip GL work while hidden: keep the loop alive, drop the cost.
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
    // stopsKey covers the colors array contents.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [amplitude, dotSize, floor, gap, speed, stopsKey]);

  return (
    <canvas
      aria-hidden="true"
      className={cn("size-full", className)}
      data-slot="dot-matrix-wave"
      ref={canvasRef}
      {...props}
    />
  );
};
