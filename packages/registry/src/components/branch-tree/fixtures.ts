import type { Branch } from "./branch-tree";

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

/** A realistic branch tree for docs previews and tests (parent is a branch id). */
export const branches: Branch[] = [
  {
    default: true,
    id: "br_main",
    name: "main",
    protected: true,
    state: "active",
    updatedAt: ago(3),
  },
  {
    id: "br_dev",
    name: "dev",
    parent: "br_main",
    state: "idle",
    updatedAt: ago(42),
  },
  {
    id: "br_staging",
    name: "staging",
    parent: "br_main",
    state: "scaling",
    updatedAt: ago(11),
  },
  {
    id: "br_feat_billing",
    name: "feat/billing",
    parent: "br_dev",
    state: "suspended",
    updatedAt: ago(180),
  },
  {
    id: "br_feat_auth",
    name: "feat/auth",
    parent: "br_dev",
    state: "active",
    updatedAt: ago(1),
  },
  {
    id: "br_preview_pr_218",
    name: "preview/pr-218",
    parent: "br_feat_auth",
    state: "suspended",
    updatedAt: ago(1440),
  },
];
