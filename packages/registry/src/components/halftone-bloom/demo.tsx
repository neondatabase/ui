import { HalftoneBloom } from "./halftone-bloom";

export const HalftoneBloomDemo = () => (
  <div className="relative isolate h-64 w-full max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-black">
    <HalftoneBloom className="absolute inset-0" />
    <div className="relative flex h-full flex-col items-start justify-end p-6">
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
        Serverless Postgres
      </p>
      <p className="mt-1 max-w-xs font-semibold text-foreground text-xl tracking-tight">
        Light behind the screen.
      </p>
    </div>
  </div>
);

export default HalftoneBloomDemo;
