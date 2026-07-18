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
      return;
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
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
    gl.uniform1f(uIntensity, intensity);
    gl.uniform1f(uNoise, noise);
    gl.uniform1f(uGrain, grainSize);
    gl.uniform1f(uLift, 0);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let lift = 0;
    let liftTarget = 0;

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

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

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
      lift += (liftTarget - lift) * LIFT_EASE;
      gl.uniform1f(uLift, lift);
      gl.uniform1f(uTime, (now / 1000) * speed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };

    const cleanupHover = () => {
      hoverHost?.removeEventListener("pointerenter", raiseLift);
      hoverHost?.removeEventListener("pointerleave", dropLift);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduced.matches || speed === 0) {
      gl.uniform1f(uTime, 1);
      resize();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return () => {
        cleanupHover();
        observer.disconnect();
      };
    }

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      cleanupHover();
      observer.disconnect();
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
