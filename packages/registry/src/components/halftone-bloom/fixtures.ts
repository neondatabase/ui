import type { BloomLight } from "./halftone-bloom";

/**
 * Light rigs for the bloom field. Colors sampled from the neon.com
 * pattern art (right-pattern-sm, right-pattern-lg, left-pattern) and
 * the heritage background reference.
 */
export const bloomScenes: Record<
  "heritage" | "sunrise" | "meadow" | "spring",
  { highlight: string; lights: BloomLight[] }
> = {
  // The dark background reference: teal holding the left, amber mass
  // on the right overexposing toward cream.
  heritage: {
    highlight: "#ecdcae",
    lights: [
      { color: "#1d5e57", radius: 0.25, x: 0.06, y: 0.9 },
      { color: "#1d5e57", intensity: 0.95, radius: 0.21, x: 0.42, y: 0.05 },
      {
        color: "#c4692e",
        intensity: 1.6,
        overexpose: 1,
        radius: 0.27,
        x: 0.92,
        y: 0.45,
      },
      {
        color: "#c4692e",
        intensity: 1.1,
        overexpose: 1,
        radius: 0.19,
        x: 0.78,
        y: 0.08,
      },
    ],
  },
  // right-pattern-sm: brand green swelling in from the left, harvest
  // yellow burning at the right shoulder.
  meadow: {
    highlight: "#f0e6a8",
    lights: [
      { color: "#1e9763", intensity: 0.9, radius: 0.55, x: 0.35, y: 0.4 },
      { color: "#47a468", radius: 0.4, x: 0.62, y: 0.55 },
      { color: "#e5d57e", intensity: 1.2, radius: 0.4, x: 0.78, y: 0.5 },
    ],
  },
  // right-pattern-lg: yellow-green cresting at center over the brand
  // green, both shoulders falling away.
  spring: {
    highlight: "#e9e6a4",
    lights: [
      { color: "#48a468", intensity: 0.8, radius: 0.45, x: 0.25, y: 0.35 },
      { color: "#cece7b", intensity: 1.2, radius: 0.38, x: 0.45, y: 0.6 },
      { color: "#279a63", intensity: 0.8, radius: 0.5, x: 0.68, y: 0.45 },
    ],
  },
  // left-pattern: orange igniting the left edge, cooling through
  // amber and sand into the brand green, fading out rightward.
  sunrise: {
    highlight: "#f9e2b8",
    lights: [
      { color: "#f66d23", intensity: 1.5, radius: 0.5, x: 0.02, y: 0.5 },
      { color: "#f99644", intensity: 1.1, radius: 0.45, x: 0.16, y: 0.5 },
      { color: "#c8bb83", radius: 0.45, x: 0.32, y: 0.5 },
      { color: "#3da36f", radius: 0.5, x: 0.52, y: 0.5 },
      { color: "#1e9763", intensity: 0.5, radius: 0.55, x: 0.72, y: 0.5 },
    ],
  },
};
