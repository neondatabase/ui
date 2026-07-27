"use client";

import { storageSegments } from "./fixtures";
import { StorageBreakdown } from "./storage-breakdown";

export const StorageBreakdownDemo = () => (
  <StorageBreakdown
    className="w-full max-w-md"
    period="Feb 1 – Feb 14"
    segments={storageSegments}
    unit="GB-mo"
  />
);

export default StorageBreakdownDemo;
