"use client";

import { useState } from "react";

import { ColorPicker } from "./color-picker";
import { defaultColor, neonSwatches } from "./fixtures";

export const ColorPickerDemo = () => {
  const [color, setColor] = useState(defaultColor);

  return (
    <div className="flex flex-col items-center gap-4">
      <ColorPicker
        onValueChange={setColor}
        swatches={neonSwatches}
        value={color}
      />
      <div
        className="h-10 w-48 border border-border/60"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

export default ColorPickerDemo;
