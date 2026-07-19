import type { Checkpoint } from "./checkpoint-timeline";

/** A working session the way the agent writes it, newest first. */
export const sampleCheckpoints: Checkpoint[] = [
  {
    createdAt: "2m ago",
    id: "cp_04",
    label: "Added billing page with plan gating",
    projectId: "damp-forest-123456",
    sha: "f39ac2d",
    snapshot: true,
  },
  {
    createdAt: "18m ago",
    id: "cp_03",
    label: "Wired auth to session table",
    projectId: "damp-forest-123456",
    sha: "b81e04a",
    snapshot: true,
  },
  {
    createdAt: "41m ago",
    id: "cp_02",
    label: "Scaffolded CRM schema and seed data",
    projectId: "damp-forest-123456",
    sha: "20d97c1",
    snapshot: false,
  },
  {
    createdAt: "1h ago",
    id: "cp_01",
    label: "Initial scaffold",
    projectId: "damp-forest-123456",
    sha: "8a3f5e2",
    snapshot: true,
  },
];
