import type { AppStatus } from "@/components/status-badge/status-badge";

/** Status hues the wash renders in, using the shared vocabulary's classes. */
export const washTints: { label: string; status: AppStatus; tint: string }[] = [
  { label: "ready", status: "ready", tint: "text-primary" },
  { label: "error", status: "error", tint: "text-destructive" },
  { label: "stopped", status: "stopped", tint: "text-muted-foreground" },
];
