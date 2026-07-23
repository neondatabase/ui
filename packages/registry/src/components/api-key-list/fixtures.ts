import type { ApiKey } from "./api-key-list";

/** A realistic mix of personal and org keys for docs previews and tests. */
export const apiKeys: ApiKey[] = [
  {
    createdAt: "Jul 18, 2026",
    id: "key_1",
    lastUsedAt: "2h ago",
    name: "production-deploy",
    scope: "personal",
  },
  {
    createdAt: "Jun 30, 2026",
    id: "key_2",
    lastUsedAt: "3d ago",
    name: "ci-pipeline",
    scope: "organization",
  },
  {
    createdAt: "May 2, 2026",
    id: "key_3",
    name: "local-scratch",
    scope: "personal",
  },
];
