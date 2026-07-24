"use client";

import { useState } from "react";

import { BranchTree } from "./branch-tree";
import { branches } from "./fixtures";

export const BranchTreeDemo = () => {
  const [value, setValue] = useState("br_feat_auth");

  return (
    <BranchTree
      branches={branches}
      className="w-[28rem]"
      onValueChange={setValue}
      value={value}
    />
  );
};

export default BranchTreeDemo;
