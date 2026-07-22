import type { BannerPatternPalette } from "./banner-pattern";

/**
 * Palettes for the dot field: [base, green, sage, amber, cream, rust],
 * painted back to front. "brand" matches neon.com's banner-pattern.svg.
 */
export const bannerPalettes: Record<
  "brand" | "neon" | "dusk",
  BannerPatternPalette
> = {
  brand: ["#0a0b09", "#34d59a", "#97b47d", "#feaa2c", "#ffeacc", "#b03323"],
  dusk: ["#0a0912", "#4338ca", "#7c6bd8", "#d75f9e", "#f2e2ef", "#7f1d4e"],
  neon: ["#050a07", "#0e5f45", "#2f9c73", "#00e599", "#d9ffe9", "#0b7d54"],
};
