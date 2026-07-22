/** The shape a structured-output citation route streams back. */
export interface Citation {
  number: string;
  title: string;
  url: string;
  description?: string;
  quote?: string;
}

/** A cited paragraph with `[n]` markers, as a model would emit it. */
export const citedContent =
  "Neon separates storage from compute, so a branch shares its parent's data until either side diverges — creating one is a copy-on-write operation, not a copy [1]. Idle computes suspend automatically and resume in well under a second, which is what makes per-tenant databases economical [2].";

/** Sources backing the paragraph above. */
export const citations: Citation[] = [
  {
    description:
      "How branches share pages with their parent via copy-on-write storage.",
    number: "1",
    quote:
      "A branch is a copy-on-write clone of your database. Creating one takes seconds, regardless of database size.",
    title: "Branching — Neon Docs",
    url: "https://neon.com/docs/introduction/branching",
  },
  {
    description:
      "Scale to zero suspends idle computes; cold starts stay in the hundreds of milliseconds.",
    number: "2",
    title: "Scale to Zero — Neon Docs",
    url: "https://neon.com/docs/introduction/scale-to-zero",
  },
];
