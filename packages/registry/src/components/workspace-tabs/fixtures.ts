/** The workspace's standard tab set. */
export const workspaceTabIds = ["preview", "checkpoints", "usage"] as const;

export const sampleCheckpointCount = 4;

export const paneCopy = {
  checkpoints: "Checkpoint timeline renders here.",
  preview: "Live app preview renders here.",
  usage: "Usage metrics render here.",
} as const;
