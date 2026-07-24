import { ActivityFeed } from "./activity-feed";
import { activityEntries } from "./fixtures";

export const ActivityFeedDemo = () => (
  <ActivityFeed className="w-full max-w-md" entries={activityEntries} />
);

export default ActivityFeedDemo;
