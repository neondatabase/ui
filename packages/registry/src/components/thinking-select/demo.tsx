"use client";

import { useState } from "react";

import { defaultEffort } from "./fixtures";
import { ThinkingSelect } from "./thinking-select";
import type { ThinkingEffort } from "./thinking-select";

export const ThinkingSelectDemo = () => {
  const [effort, setEffort] = useState<ThinkingEffort>(defaultEffort);

  return (
    <div className="flex w-72 flex-col gap-3">
      <ThinkingSelect onValueChange={setEffort} size="lg" value={effort} />
      <ThinkingSelect onValueChange={setEffort} size="md" value={effort} />
      <ThinkingSelect onValueChange={setEffort} size="sm" value={effort} />
    </div>
  );
};

export default ThinkingSelectDemo;
