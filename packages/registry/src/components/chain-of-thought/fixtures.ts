import type { ChainOfThoughtStepStatus } from "./chain-of-thought";

/** A believable agent run: research, draft, migrate. */
export const chainOfThoughtSteps: {
  label: string;
  description?: string;
  searchResults?: { title: string; url: string }[];
  status: ChainOfThoughtStepStatus;
}[] = [
  {
    description: "Book tracker with reading status and ratings",
    label: "Parsing the request",
    status: "complete",
  },
  {
    label: "Searching the Neon docs",
    searchResults: [
      {
        title: "neon.com/docs/branching",
        url: "https://neon.com/docs/introduction/branching",
      },
      {
        title: "neon.com/docs/schema-migrations",
        url: "https://neon.com/docs/get-started-with-neon/workflow-primer",
      },
    ],
    status: "complete",
  },
  {
    description: "books, authors, reading_log",
    label: "Drafting the schema",
    status: "active",
  },
  {
    label: "Writing the migration",
    status: "pending",
  },
];
