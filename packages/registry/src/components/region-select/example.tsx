"use client";

import { useState } from "react";

import { neonAwsRegions } from "./fixtures";
import { RegionSelect } from "./region-select";

/**
 * The create-project wiring: hold the region id in form state and
 * pass it along on submit. The select under the map is the same
 * input, so keyboard and screen-reader users never touch the map.
 */
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // POST /projects with { region_id: <form state> }
};

export const RegionSelectExample = () => {
  const [region, setRegion] = useState<string>("aws-us-east-1");

  return (
    <form
      className="flex w-full max-w-xl flex-col gap-4"
      onSubmit={handleSubmit}
    >
      <RegionSelect
        onValueChange={setRegion}
        regions={neonAwsRegions}
        value={region}
      />
      <button
        className="self-end rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm"
        type="submit"
      >
        Create project
      </button>
    </form>
  );
};
