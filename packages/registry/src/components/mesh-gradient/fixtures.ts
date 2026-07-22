import type { MeshGradientPalette } from "./mesh-gradient";

/**
 * Palettes for the mesh field: [base, moss, ember, gold, bloom],
 * painted back to front. "brand" is the Neon deck gradient.
 */
export const meshPalettes: Record<
  "brand" | "neon" | "dusk",
  MeshGradientPalette
> = {
  brand: ["#0b0b08", "#2c4a33", "#a85f1b", "#edbf4e", "#eef2a0"],
  dusk: ["#0a0912", "#1e2a52", "#6d3fb4", "#d75f9e", "#f2c9df"],
  neon: ["#050a07", "#123c2b", "#0e5f45", "#00b377", "#8ff5cc"],
};
