import { DBConnectionCard } from "./db-connection-card";
import { connectionDefault } from "./fixtures";

export const DBConnectionCardDemo = () => (
  <DBConnectionCard className="w-full max-w-md" {...connectionDefault} />
);

export default DBConnectionCardDemo;
