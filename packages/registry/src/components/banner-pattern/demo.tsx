import { BannerPattern } from "./banner-pattern";

export const BannerPatternDemo = () => (
  <div className="relative isolate aspect-square w-full max-w-md overflow-hidden rounded-lg border border-border/60 bg-black sm:aspect-[6/5]">
    <BannerPattern className="absolute inset-0" />
    {/* Text protection is the consumer's overlay, not the pattern's. */}
    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
    <div className="relative flex h-full flex-col items-start justify-end p-6">
      <p className="font-semibold text-2xl text-white tracking-tight">
        What is Neon
      </p>
      <p className="mt-1 text-sm text-white/60">
        Serverless Postgres, by Databricks
      </p>
    </div>
  </div>
);

export default BannerPatternDemo;
