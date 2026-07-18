import { NeonAurora } from "./neon-aurora";

export const NeonAuroraDemo = () => (
  <div className="relative isolate h-64 w-full max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-black">
    <NeonAurora className="absolute inset-0" />
    <div className="relative flex h-full flex-col items-start justify-end p-6">
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
        Serverless Postgres
      </p>
      <p className="mt-1 max-w-xs font-semibold text-foreground text-xl tracking-tight">
        Build on the database your agents already know.
      </p>
    </div>
  </div>
);

export default NeonAuroraDemo;
