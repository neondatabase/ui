"use client";

import { useState } from "react";

import { AnimatedWash } from "@/components/animated-wash/animated-wash";

import { ColorPicker } from "./color-picker";
import { neonSwatches } from "./fixtures";

/**
 * Tint a live surface: the picker drives `color` on the wrapper, and any
 * currentColor consumer — here the AnimatedWash shader — follows.
 */
export const ColorPickerExample = () => {
  const [color, setColor] = useState("#00e599");

  return (
    <div className="flex flex-col gap-3">
      <ColorPicker
        onValueChange={setColor}
        swatches={neonSwatches}
        value={color}
      />
      <div
        className="relative isolate h-32 overflow-hidden rounded-lg border border-border/60 bg-card"
        data-wash-hover
        style={{ color }}
      >
        <AnimatedWash className="absolute inset-0" key={color} />
      </div>
    </div>
  );
};
