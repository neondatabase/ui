import { NeonAurora } from "./neon-aurora";

/**
 * A hero section over the aurora field: the shader is decorative, so all
 * content stays in the DOM above it and reduced motion freezes a single
 * frame automatically.
 */
export const NeonAuroraExample = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <section className="relative isolate overflow-hidden bg-black">
    <NeonAurora className="absolute inset-0 opacity-80" />
    <div className="relative mx-auto max-w-4xl px-6 py-24">{children}</div>
  </section>
);
