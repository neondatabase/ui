import type { Branch } from "./branch-picker";

/** A realistic branch tree for docs previews and tests (parent is a branch id). */
export const branches: Branch[] = [
  { default: true, id: "br_main", name: "main", protected: true },
  { id: "br_dev", name: "dev", parent: "br_main" },
  { id: "br_staging", name: "staging", parent: "br_main" },
  { id: "br_feat_billing", name: "feat/billing", parent: "br_dev" },
  { id: "br_feat_auth", name: "feat/auth", parent: "br_dev" },
  { id: "br_preview_pr_218", name: "preview/pr-218", parent: "br_feat_auth" },
];
