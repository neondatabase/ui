/*
 * The changelog timeline: a quiet hairline rail, one dated card per
 * entry, newest first. Entries live in changelog-entries.json and are
 * appended by CI on every merged PR (see CONTRIBUTING.md → Changelog);
 * hand-edit the JSON to curate. Purely presentational.
 */

import entriesData from "./changelog-entries.json";

interface Item {
  /** Backtick segments render as code. */
  text: string;
  /** Route of the live docs page this change ships on. */
  href?: string;
  /** Conventional-commit kind: feat, fix, docs, perf, refactor, chore. */
  kind?: string;
}

interface Entry {
  /** ISO date, e.g. "2026-07-20". */
  date: string;
  title: string;
  author?: string;
  /** Pull request number; renders as a GitHub link. */
  pr?: number;
  items: Item[];
}

const ENTRIES = entriesData as Entry[];

const DEFAULT_AUTHOR = "Justin Levine";

/** Display labels for item kinds; anything unmapped renders as-is. */
const KIND_LABELS: Record<string, string> = {
  chore: "internal",
  docs: "docs",
  feat: "new",
  fix: "fix",
  perf: "perf",
  refactor: "cleanup",
};
const REPO_URL = "https://github.com/neondatabase/ui";

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Render backtick segments as code without pulling in a parser. */
const renderText = (text: string) =>
  text.split("`").map((segment, index) =>
    index % 2 === 1 ? (
      <code
        className="font-mono text-[0.8125rem] text-foreground/90"
        // oxlint-disable-next-line react/no-array-index-key -- segments are positional
        key={`c-${index}`}
      >
        {segment}
      </code>
    ) : (
      // oxlint-disable-next-line react/no-array-index-key -- segments are positional
      <span key={`t-${index}`}>{segment}</span>
    )
  );

const ItemLine = ({ item }: { item: Item }) => (
  <li className="relative pl-4 text-[0.9375rem] text-muted-foreground leading-relaxed before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-2 before:bg-border">
    {item.kind && (
      <span className="mr-2 inline-block align-[0.08em] font-mono text-[10px] text-muted-foreground/70 uppercase">
        {KIND_LABELS[item.kind] ?? item.kind}
      </span>
    )}
    {renderText(item.text)}
    {item.href && (
      <a
        className="ml-2 whitespace-nowrap font-mono text-[11px] text-primary/80 no-underline transition-colors hover:text-primary"
        href={item.href}
      >
        view →
      </a>
    )}
  </li>
);

export default function ChangelogTimeline() {
  return (
    <div className="not-prose mt-10">
      <ol className="list-none">
        {ENTRIES.map((entry) => (
          <li
            className="group relative grid gap-2 pb-12 sm:grid-cols-[9.5rem_1fr] sm:gap-8"
            key={`${entry.date}-${entry.title}`}
          >
            {/* The rail: a hairline running behind the node dots,
                stopping with the last entry. */}
            <span
              aria-hidden="true"
              className="absolute top-1.5 bottom-0 left-[-1.03rem] hidden w-px bg-border/60 group-last:hidden sm:block"
            />
            <span
              aria-hidden="true"
              className="absolute top-1.5 left-[-1.22rem] hidden size-[7px] rounded-full border border-primary/70 bg-background sm:block"
            />
            <div className="pt-px">
              <time
                className="block font-mono text-muted-foreground text-xs uppercase tracking-wide"
                dateTime={entry.date}
              >
                {formatDate(entry.date)}
              </time>
              <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground/80">
                by {entry.author ?? DEFAULT_AUTHOR}
              </span>
            </div>
            <div className="border border-border/60 bg-card/40 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-semibold text-base text-foreground tracking-tight">
                  {entry.title}
                </h2>
                {entry.pr && (
                  <a
                    className="shrink-0 font-mono text-[11px] text-muted-foreground no-underline transition-colors hover:text-foreground"
                    href={`${REPO_URL}/pull/${entry.pr}`}
                    rel="noopener"
                    target="_blank"
                  >
                    #{entry.pr}
                  </a>
                )}
              </div>
              <ul className="mt-3 flex list-none flex-col gap-2">
                {entry.items.map((item) => (
                  <ItemLine item={item} key={item.text} />
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
