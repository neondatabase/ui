/** The restore confirmation the workspace uses. */
export const restoreConfirm = {
  confirmLabel: "Hold to restore",
  description:
    "Your app and database roll back together. Work after this checkpoint stays in history and can be restored again.",
  title: "Restore this checkpoint?",
} as const;

/** A harder one: deletion. */
export const deleteConfirm = {
  confirmLabel: "Hold to delete",
  description:
    "acme-crm and its Neon project are deleted immediately. This cannot be undone.",
  title: "Delete this app?",
} as const;
