import type {
  AppPlan,
  AppStatus,
} from "@/components/status-badge/status-badge";

/** A believable tenant dashboard grid. */
export const apps: {
  description: string;
  name: string;
  plan: AppPlan;
  status: AppStatus;
  updatedAt: string;
}[] = [
  {
    description:
      "Track your reading list with an add-book form and read/unread toggles.",
    name: "book-tracker",
    plan: "paid",
    status: "ready",
    updatedAt: "2h ago",
  },
  {
    description: "Search invoices by vendor, amount, and line items.",
    name: "invoice-search",
    plan: "free",
    status: "provisioning",
    updatedAt: "just now",
  },
  {
    description: "Summarize the team's standup notes into weekly digests.",
    name: "standup-notes",
    plan: "free",
    status: "error",
    updatedAt: "3d ago",
  },
  {
    description: "Store and scale family recipes with unit conversion.",
    name: "recipe-box",
    plan: "free",
    status: "stopped",
    updatedAt: "2w ago",
  },
];
