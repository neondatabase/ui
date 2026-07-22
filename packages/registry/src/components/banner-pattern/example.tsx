import { BannerPattern } from "./banner-pattern";
import { bannerPalettes } from "./fixtures";

/**
 * A banner card: the parent owns the size, the pattern fills it, and
 * content stacks on top with its own scrim for text contrast. Swap
 * `colors` for another palette (or your own six stops) and tune the
 * grid with `cell` and `dotSize` without touching the field.
 */
export const BannerPatternExample = () => (
  <a
    className="group relative isolate block aspect-[2/1] w-full overflow-hidden rounded-lg border border-border/60 bg-black"
    href="https://neon.com"
    rel="noopener noreferrer"
    target="_blank"
  >
    <BannerPattern
      cell={8}
      className="absolute inset-0"
      colors={bannerPalettes.brand}
      speed={0.5}
    />
    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
    <div className="relative flex h-full flex-col items-start justify-end p-6">
      <p className="font-mono text-[10px] text-white/60 uppercase tracking-wide">
        Docs
      </p>
      <p className="mt-1 font-semibold text-lg text-white tracking-tight transition-colors group-hover:text-primary">
        What is Neon
      </p>
    </div>
  </a>
);
