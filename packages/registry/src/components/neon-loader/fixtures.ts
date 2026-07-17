import type { NeonLoaderProps } from "./neon-loader";

export const neonLoaderDefault = {
  label: "Loading",
  size: "lg",
} satisfies NeonLoaderProps;

export const neonLoaderSizes = [
  { label: "Small", size: "sm" },
  { label: "Medium", size: "md" },
  { label: "Large", size: "lg" },
] satisfies NeonLoaderProps[];
