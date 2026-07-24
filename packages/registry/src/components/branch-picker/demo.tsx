"use client";

import { useState } from "react";

import type { Branch } from "./branch-picker";
import { BranchPicker } from "./branch-picker";
import { branches as initialBranches } from "./fixtures";

export const BranchPickerDemo = () => {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [value, setValue] = useState("br_main");

  return (
    <BranchPicker
      branches={branches}
      onCreateBranch={(name, fromId) => {
        const id = `br_${crypto.randomUUID()}`;
        setBranches((current) => [...current, { id, name, parent: fromId }]);
        setValue(id);
      }}
      onValueChange={setValue}
      value={value}
    />
  );
};

export default BranchPickerDemo;
