import { MeshGradient } from "./mesh-gradient";

export const MeshGradientDemo = () => (
  <div className="relative isolate aspect-video w-full max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-black">
    <MeshGradient className="absolute inset-0" />
    {/* Text protection is the consumer's overlay, not the gradient's. */}
    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />
    <div className="relative flex h-full flex-col items-start justify-end p-6">
      <p className="font-mono text-[10px] text-white/60 uppercase tracking-wide">
        Serverless Postgres
      </p>
      <p className="mt-1 max-w-sm font-semibold text-white text-xl tracking-tight">
        Faster application development on serverless Postgres.
      </p>
    </div>
  </div>
);

export default MeshGradientDemo;
