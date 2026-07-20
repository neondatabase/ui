"use client";

import { sampleCards } from "./fixtures";
import { RegionCard } from "./region-card";

export const RegionCardDemo = () => (
  <div className="flex w-full max-w-md flex-col gap-3">
    {sampleCards.map((card) => (
      <RegionCard
        key={card.regionId}
        ping={card.ping}
        regionId={card.regionId}
        title={card.title}
      />
    ))}
  </div>
);

export default RegionCardDemo;
