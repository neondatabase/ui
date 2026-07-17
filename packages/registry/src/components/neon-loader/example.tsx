import { NeonLoader } from "./neon-loader";

export const NeonLoaderExample = () => (
  <div aria-busy="true" className="flex min-h-32 items-center justify-center">
    <NeonLoader label="Provisioning database" size="lg" />
  </div>
);
