/** A believable extended-thinking trace for a schema-design ask. */
export const reasoningText = `The user wants a Postgres schema for a book tracker with reading status and ratings.

Three tables cover it: \`books\` for the catalog, \`authors\` since books and authors are many-to-many, and \`reading_log\` for per-user status. Ratings belong on the log, not the book — a rating is an opinion about a reading, and this keeps re-reads cheap.

Status should be an enum (\`want_to_read\`, \`reading\`, \`finished\`, \`abandoned\`) rather than free text, so the status filter stays an index scan. I'll draft the tables first, then the join table, then the indexes.`;

/** Seconds the trace above plausibly took. */
export const reasoningDuration = 7;
