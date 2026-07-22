import { meshPalettes } from "./fixtures";
import { MeshGradient } from "./mesh-gradient";

/**
 * A full-bleed marketing hero: the parent owns the size, the gradient
 * fills it, and content stacks on top with its own scrim for text
 * contrast. Swap `colors` for another palette (or your own five
 * stops) without touching the geometry.
 */
export const MeshGradientExample = () => (
  <section className="relative isolate h-[60vh] w-full overflow-hidden bg-black">
    <MeshGradient
      className="absolute inset-0"
      colors={meshPalettes.brand}
      speed={0.5}
    />
    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
    <div className="relative mx-auto flex h-full max-w-4xl flex-col items-start justify-end px-6 pb-14">
      <p className="font-mono text-white/60 text-xs uppercase tracking-wide">
        Neon
      </p>
      <h1 className="mt-2 max-w-2xl font-semibold text-4xl text-white tracking-tight">
        Faster application development on serverless Postgres
      </h1>
    </div>
  </section>
);
