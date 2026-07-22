"use client";

/*
 * Adapted from paper-design/shaders (GrainGradient concept)
 * https://github.com/paper-design/shaders — Apache-2.0.
 *
 * Neon UI fork: a single-purpose WebGL wash — a color gradient rising from
 * the bottom edge, dithered with animated grain. Color comes from
 * currentColor at mount (same contract as NeonLoader), so the status hue
 * or theme drives it with zero props. Hovering the nearest interactive
 * ancestor lifts and warms the field. Static under reduced motion.
 * The GLSL lives in animated-wash-shader.ts.
 */

import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { WASH_FRAGMENT, WASH_VERTEX } from "./animated-wash-shader";

export type AnimatedWashProps = Omit<ComponentProps<"canvas">, "children"> & {
  /** Grain refresh speed multiplier; 0 freezes the field. */
  speed?: number;
  /** 0-1 strength of the smooth gradient under the grain. */
  intensity?: number;
  /** 0-1 grain strength over the gradient. */
  noise?: number;
  /** Grain cell size in device pixels; bigger reads chunkier. */
  grainSize?: number;
};

/** How fast the hover lift eases toward its target each frame. */
const LIFT_EASE = 0.08;

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

export const AnimatedWash = ({
  className,
  grainSize = 3,
  intensity = 0.2,
  noise = 0.35,
  speed = 1,
  ...props
}: AnimatedWashProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Shader time, accumulated frame by frame so a speed change scales
  // the flow from here instead of teleporting the whole field.
  const phaseRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  // Smoothed dial values, persisting across prop-driven re-inits.
  const smoothedRef = useRef<Record<string, number> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
    });

    if (!gl) {
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, WASH_VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, WASH_FRAGMENT);
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
    const uIntensity = gl.getUniformLocation(program, "u_intensity");
    const uNoise = gl.getUniformLocation(program, "u_noise");
    const uGrain = gl.getUniformLocation(program, "u_grain");
    const uLift = gl.getUniformLocation(program, "u_lift");
    const uColor = gl.getUniformLocation(program, "u_color");

    const color = parseColor(getComputedStyle(canvas).color);
    gl.uniform3f(uColor, color[0], color[1], color[2]);
    const targets: Record<string, number> = {
      grainSize,
      intensity,
      noise,
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

      gl.uniform1f(uIntensity, smoothed.intensity ?? intensity);
      gl.uniform1f(uNoise, smoothed.noise ?? noise);
      gl.uniform1f(uGrain, smoothed.grainSize ?? grainSize);
    };
    gl.uniform1f(uLift, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let lift = 0;
    let liftTarget = 0;
    let staticFrame = false;

    const renderStatic = () => {
      applyUniforms(1);
      gl.uniform1f(uTime, 1);
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

    // React to hover on the nearest interactive ancestor (the card link),
    // falling back to the direct parent.
    const hoverHost =
      canvas.closest("a, button, [data-wash-hover]") ?? canvas.parentElement;
    const raiseLift = () => {
      liftTarget = 1;
    };
    const dropLift = () => {
      liftTarget = 0;
    };
    hoverHost?.addEventListener("pointerenter", raiseLift);
    hoverHost?.addEventListener("pointerleave", dropLift);

    const draw = (now: number) => {
      const last = lastFrameRef.current ?? now;
      lastFrameRef.current = now;
      // Skip GL work while hidden — keep the loop alive, drop the cost.
      if (!(canvas.checkVisibility?.() ?? true)) {
        frame = requestAnimationFrame(draw);
        return;
      }

      lift += (liftTarget - lift) * LIFT_EASE;
      gl.uniform1f(uLift, lift);
      const dt = (now - last) / 1000;
      applyUniforms(1 - Math.exp(-dt / SMOOTH_TAU));
      phaseRef.current += dt * (smoothed.speed ?? speed);
      gl.uniform1f(uTime, phaseRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };

    const cleanupHover = () => {
      hoverHost?.removeEventListener("pointerenter", raiseLift);
      hoverHost?.removeEventListener("pointerleave", dropLift);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduced.matches || speed === 0) {
      staticFrame = true;
      resize();
      renderStatic();
      return () => {
        cleanupHover();
        dispose();
      };
    }

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      cleanupHover();
      dispose();
    };
  }, [grainSize, intensity, noise, speed]);

  return (
    <canvas
      aria-hidden="true"
      className={cn("size-full", className)}
      data-slot="animated-wash"
      ref={canvasRef}
      {...props}
    />
  );
};
