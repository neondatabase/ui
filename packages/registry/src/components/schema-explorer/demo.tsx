"use client";

import { tables } from "./fixtures";
import { SchemaExplorer } from "./schema-explorer";

export const SchemaExplorerDemo = () => (
  <SchemaExplorer
    className="w-full max-w-md"
    defaultExpanded={["projects"]}
    tables={tables}
  />
);

export default SchemaExplorerDemo;
