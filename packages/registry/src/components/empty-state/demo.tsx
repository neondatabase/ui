import { Button } from "@/components/ui/button";

import { EmptyState } from "./empty-state";
import { emptyStates } from "./fixtures";

export const EmptyStateDemo = () => (
  <EmptyState
    action={<Button size="sm">{emptyStates.apps.actionLabel}</Button>}
    className="w-full max-w-md"
    description={emptyStates.apps.description}
    title={emptyStates.apps.title}
  />
);

export default EmptyStateDemo;
