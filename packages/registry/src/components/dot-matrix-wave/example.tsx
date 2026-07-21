import { DotMatrixWave } from "./dot-matrix-wave";

/**
 * A section over the dot field: the shader is decorative, colored by
 * the text-primary ancestor, and reduced motion freezes a single frame
 * automatically.
 */
export const DotMatrixWaveExample = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <section className="relative isolate overflow-hidden bg-black text-primary">
    <DotMatrixWave className="absolute inset-0 opacity-60" />
    <div className="relative mx-auto max-w-4xl px-6 py-24">{children}</div>
  </section>
);
