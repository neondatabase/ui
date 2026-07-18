import { AppCard } from "./app-card";
import { apps } from "./fixtures";

export const AppCardDemo = () => (
  <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
    {apps.map((app) => (
      <AppCard
        description={app.description}
        href="#"
        key={app.name}
        name={app.name}
        onClick={(event) => event.preventDefault()}
        plan={app.plan}
        status={app.status}
        updatedAt={app.updatedAt}
      />
    ))}
  </div>
);

export default AppCardDemo;
