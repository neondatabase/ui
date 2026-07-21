import { HalftoneBloom } from "./halftone-bloom";

/**
 * A hero section over the bloom screen: the shader is decorative, so
 * all content stays in the DOM above it and reduced motion freezes a
 * single frame automatically.
 */
export const HalftoneBloomExample = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <section className="relative isolate overflow-hidden bg-black">
    <HalftoneBloom className="absolute inset-0" />
    <div className="relative mx-auto max-w-4xl px-6 py-24">{children}</div>
  </section>
);
