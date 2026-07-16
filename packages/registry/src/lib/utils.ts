import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with correct conflict resolution.
 * Later classes win (`cn("p-2", "p-4")` => `"p-4"`).
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
