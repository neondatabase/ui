"use client";

import {
  Copy01Icon,
  Tick02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { ComponentProps, ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COPY_FLASH_MS = 1500;
const MASK = "\u2022\u2022\u2022\u2022\u2022";
const DEFAULT_PORT = "5432";

type ConnectionFormat = "uri" | "psql" | "params" | "agent";

export interface ConnectionSelection {
  role: string;
  database: string;
  /** Pooled (PgBouncer) connection when true, direct when false. */
  pooled: boolean;
}

export interface ConnectionEntry extends ConnectionSelection {
  /** The full connection string for this role/database/pooled combination. */
  uri: string;
}

interface ConnectionParams {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

interface ParsedUri {
  /** scheme + role, up to the password. */
  head: string;
  password: string;
  /** From the at-sign on: host, database, and query. */
  tail: string;
}

/** Split so only the password needs hiding. Null when not URL-shaped. */
const parseUri = (uri: string): ParsedUri | null => {
  try {
    const url = new URL(uri);

    if (!url.password) {
      return null;
    }

    return {
      head: `${url.protocol}//${decodeURIComponent(url.username)}:`,
      password: decodeURIComponent(url.password),
      tail: uri.slice(uri.indexOf("@")),
    };
  } catch {
    return null;
  }
};

const parseParams = (uri: string): ConnectionParams | null => {
  try {
    const url = new URL(uri);

    return {
      database: url.pathname.replace(/^\//u, ""),
      host: url.hostname,
      password: decodeURIComponent(url.password),
      port: url.port || DEFAULT_PORT,
      user: decodeURIComponent(url.username),
    };
  } catch {
    return null;
  }
};

/** A paste-ready agent prompt, secret excluded: point the agent at the env var. */
const buildAgentPrompt = (params: ConnectionParams | null, pooled: boolean) => {
  if (!params) {
    return "";
  }

  return [
    "Connect to a Neon Postgres database.",
    "Read the connection string from the DATABASE_URL environment variable; never hardcode credentials.",
    "",
    `host: ${params.host}`,
    `database: ${params.database}`,
    `role: ${params.user}`,
    `connection: ${pooled ? "pooled (PgBouncer)" : "direct"}, SSL required`,
  ].join("\n");
};

const unique = (values: string[]) => [...new Set(values)];

/** The longest option; in a mono font the longest string is also the widest. */
const widestOption = (options: string[]) => {
  let widest = "";
  for (const option of options) {
    if (option.length > widest.length) {
      widest = option;
    }
  }
  return widest;
};

const matches = (entry: ConnectionEntry, selection: ConnectionSelection) =>
  entry.role === selection.role &&
  entry.database === selection.database &&
  entry.pooled === selection.pooled;

/** Hover/focus label for an icon-only control. */
const IconTooltip = ({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) => (
  <Tooltip>
    <TooltipTrigger render={children} />
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

/* ─────────────────────────────────────────────────────────
 * A copy that carries the real value and flashes a primary
 * check for 1.5s, announcing through a polite live region.
 * ───────────────────────────────────────────────────────── */
const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPY_FLASH_MS);

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard unavailable (blur, permissions); the feedback still shows.
    }
  };

  return (
    <div className="relative flex shrink-0 items-center">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-full flex items-center bg-gradient-to-r from-transparent via-card to-card pr-2 pl-8 font-mono text-[10px] text-primary transition-all duration-200 ease-out motion-reduce:transition-none",
          copied ? "translate-x-0 opacity-100" : "translate-x-1 opacity-0"
        )}
      >
        Copied
      </span>
      <IconTooltip label={label}>
        <Button
          aria-label={label}
          onClick={copy}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon
            className={cn("transition-colors", copied && "text-primary")}
            icon={copied ? Tick02Icon : Copy01Icon}
            strokeWidth={2}
          />
        </Button>
      </IconTooltip>
      <span aria-live="polite" className="sr-only">
        {copied ? `${label} copied` : ""}
      </span>
    </div>
  );
};

/** The connection URI with only the password hidden; masks whole if not URL-shaped. */
const UriText = ({ uri, revealed }: { uri: string; revealed: boolean }) => {
  const parsed = parseUri(uri);

  if (!parsed) {
    return revealed ? uri : MASK;
  }

  return (
    <>
      {parsed.head}
      <span className={cn(revealed ? undefined : "text-muted-foreground")}>
        {revealed ? parsed.password : MASK}
      </span>
      {parsed.tail}
    </>
  );
};

const secretRowClassName =
  "flex min-w-0 items-center gap-1 rounded-md border border-border/60 bg-background py-1.5 pr-1 pl-2.5 transition-colors hover:border-border has-[:focus-visible]:border-primary/50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/15";
const panelClassName =
  "fade-in-0 slide-in-from-bottom-1 animate-in duration-200 motion-reduce:animate-none";
const codeClassName =
  "min-w-0 flex-1 truncate font-mono text-[11px] leading-relaxed";

const SecretRow = ({
  copyLabel,
  copyValue,
  children,
}: {
  copyLabel: string;
  copyValue: string;
  children: ReactNode;
}) => (
  <div className={secretRowClassName}>
    <code className={codeClassName}>{children}</code>
    <CopyButton label={copyLabel} value={copyValue} />
  </div>
);

const ParamsView = ({
  params,
  revealed,
}: {
  params: ConnectionParams | null;
  revealed: boolean;
}) => {
  if (!params) {
    return (
      <p className="rounded-md border border-border/60 border-dashed bg-background px-2.5 py-2 font-mono text-[11px] text-muted-foreground/70">
        no connection string
      </p>
    );
  }

  const rows: [string, string][] = [
    ["host", params.host],
    ["port", params.port],
    ["database", params.database],
    ["user", params.user],
  ];

  return (
    <dl
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-md border border-border/60 bg-background px-2.5 py-2"
      data-slot="db-connection-params"
    >
      {rows.map(([key, value]) => (
        <Fragment key={key}>
          <dt className="font-mono text-[10px] text-muted-foreground/70">
            {key}
          </dt>
          <dd className="m-0 min-w-0 truncate font-mono text-[11px] tabular-nums">
            {value}
          </dd>
          <CopyButton label={`Copy ${key}`} value={value} />
        </Fragment>
      ))}
      <dt className="font-mono text-[10px] text-muted-foreground/70">
        password
      </dt>
      <dd
        className={cn(
          "m-0 min-w-0 truncate font-mono text-[11px]",
          revealed ? undefined : "text-muted-foreground"
        )}
      >
        {revealed ? params.password : MASK}
      </dd>
      <CopyButton label="Copy password" value={params.password} />
    </dl>
  );
};

const SelectField = ({
  caption,
  value,
  options,
  onChange,
}: {
  caption: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) => {
  if (options.length <= 1) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs">
        <span className="text-[10px] text-muted-foreground/60">{caption}</span>
        <span className="text-foreground">{value}</span>
      </span>
    );
  }

  return (
    <Select
      onValueChange={(next) => {
        if (next !== null) {
          onChange(next);
        }
      }}
      value={value}
    >
      <SelectTrigger
        aria-label={caption}
        className="h-7 gap-2 rounded-md border-border/60 bg-muted/20 pr-1.5 pl-2 font-mono text-xs transition-colors hover:border-border hover:bg-muted/40"
        size="sm"
      >
        <span className="text-[10px] text-muted-foreground/60">{caption}</span>
        {/* Reserve the widest option's width (mono: longest string is widest)
            so the field doesn't reshape the row when the selection changes. */}
        <span className="grid">
          <span
            aria-hidden="true"
            className="invisible col-start-1 row-start-1 whitespace-nowrap"
          >
            {widestOption(options)}
          </span>
          <span className="col-start-1 row-start-1">
            <SelectValue />
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem className="font-mono text-xs" key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const MODES = [
  {
    hint: "Routes through PgBouncer. Best for serverless functions and many short-lived connections.",
    label: "pooled",
    pooled: true,
  },
  {
    hint: "Connects straight to the compute. Use it for migrations, long-lived clients, and session features like LISTEN/NOTIFY.",
    label: "direct",
    pooled: false,
  },
] as const;

const ModeToggle = ({
  pooled,
  onSelect,
}: {
  pooled: boolean;
  onSelect: (pooled: boolean) => void;
}) => (
  <fieldset className="m-0 inline-flex shrink-0 rounded-md border border-border/60 p-0.5">
    <legend className="sr-only">Connection mode</legend>
    {MODES.map((mode) => (
      <Tooltip key={mode.label}>
        <TooltipTrigger
          render={
            <button
              aria-pressed={pooled === mode.pooled}
              className={cn(
                "rounded-[calc(var(--radius-md)-3px)] px-2 py-0.5 font-mono text-[11px] transition-colors active:scale-[0.98] motion-reduce:active:scale-100",
                pooled === mode.pooled
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSelect(mode.pooled)}
              type="button"
            >
              {mode.label}
            </button>
          }
        />
        <TooltipContent className="max-w-60 font-sans text-xs leading-relaxed">
          {mode.hint}
        </TooltipContent>
      </Tooltip>
    ))}
  </fieldset>
);

const FORMATS: { value: ConnectionFormat; label: string }[] = [
  { label: "URI", value: "uri" },
  { label: "psql", value: "psql" },
  { label: "Parameters", value: "params" },
  { label: "Agent", value: "agent" },
];

/**
 * Animate the panel area's height as its content changes size (URI and psql
 * are one row; parameters is a grid). Measures the live content and transitions
 * `height`, so the card grows and shrinks smoothly instead of jumping.
 */
const AnimatedHeight = ({ children }: { children: ReactNode }) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const inner = innerRef.current;

    if (!inner) {
      return;
    }

    const observer = new ResizeObserver(() => setHeight(inner.offsetHeight));
    observer.observe(inner);
    setHeight(inner.offsetHeight);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none"
      style={{ height }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
};

const RevealButton = ({
  revealed,
  onToggle,
}: {
  revealed: boolean;
  onToggle: () => void;
}) => (
  <IconTooltip label={revealed ? "Hide password" : "Reveal password"}>
    <Button
      aria-label={revealed ? "Hide password" : "Reveal password"}
      aria-pressed={revealed}
      className={cn("shrink-0 transition-colors", revealed && "text-primary")}
      onClick={onToggle}
      size="icon-xs"
      type="button"
      variant="ghost"
    >
      <HugeiconsIcon
        icon={revealed ? ViewOffSlashIcon : ViewIcon}
        strokeWidth={2}
      />
    </Button>
  </IconTooltip>
);

const SelectorRow = ({
  roleOptions,
  databaseOptions,
  role,
  database,
  onRole,
  onDatabase,
}: {
  roleOptions: string[];
  databaseOptions: string[];
  role: string;
  database: string;
  onRole: (next: string) => void;
  onDatabase: (next: string) => void;
}) => {
  if (roleOptions.length === 0 && databaseOptions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {roleOptions.length > 0 ? (
        <SelectField
          caption="role"
          onChange={onRole}
          options={roleOptions}
          value={role}
        />
      ) : null}
      {databaseOptions.length > 0 ? (
        <SelectField
          caption="database"
          onChange={onDatabase}
          options={databaseOptions}
          value={database}
        />
      ) : null}
    </div>
  );
};

const FormatTabs = ({
  format,
  onFormat,
  revealed,
  onToggleReveal,
  uri,
  psql,
  params,
  agentPrompt,
  secret,
}: {
  format: ConnectionFormat;
  onFormat: (format: ConnectionFormat) => void;
  revealed: boolean;
  onToggleReveal: () => void;
  uri: string;
  psql: string;
  params: ConnectionParams | null;
  agentPrompt: string;
  secret: ReactNode;
}) => (
  <Tabs
    onValueChange={(next) => onFormat(next as ConnectionFormat)}
    value={format}
  >
    <div className="flex items-center justify-between gap-2">
      <TabsList className="gap-3" variant="line">
        {FORMATS.map((entry) => (
          <TabsTrigger
            className="flex-none px-0.5 font-mono text-xs transition-colors data-active:text-primary data-active:after:bg-primary"
            key={entry.value}
            value={entry.value}
          >
            {entry.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {format === "agent" ? null : (
        <RevealButton onToggle={onToggleReveal} revealed={revealed} />
      )}
    </div>

    <AnimatedHeight>
      <TabsContent className={panelClassName} value="uri">
        <SecretRow copyLabel="Copy connection string" copyValue={uri}>
          {secret}
        </SecretRow>
      </TabsContent>

      <TabsContent className={panelClassName} value="psql">
        <SecretRow copyLabel="Copy psql command" copyValue={psql}>
          psql &apos;{secret}&apos;
        </SecretRow>
      </TabsContent>

      <TabsContent className={panelClassName} value="params">
        <ParamsView params={params} revealed={revealed} />
      </TabsContent>

      <TabsContent className={panelClassName} value="agent">
        <div className="rounded-md border border-border/60 bg-background p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 whitespace-pre-wrap font-mono text-[11px] text-foreground/90 leading-relaxed">
              {agentPrompt}
            </p>
            <CopyButton label="Copy agent prompt" value={agentPrompt} />
          </div>
          <p className="mt-2 font-mono text-[10px] text-foreground/90 leading-relaxed">
            password excluded; the agent reads DATABASE_URL
          </p>
        </div>
      </TabsContent>
    </AnimatedHeight>
  </Tabs>
);

export type DBConnectionCardProps = Omit<
  ComponentProps<"div">,
  "children" | "onChange"
> & {
  /** Card title. */
  label?: string;
  /**
   * Every connection string, one per role/database/pooled combination. The
   * consumer owns the secret: prefetch the URIs server-side and pass them as
   * plain data. Roles, databases, and the pooled toggle are derived from this.
   */
  connections: ConnectionEntry[];
  /** Order or limit the role options; defaults to those found in connections. */
  roles?: string[];
  /** Order or limit the database options; defaults to those found in connections. */
  databases?: string[];
  defaultRole?: string;
  defaultDatabase?: string;
  /** Start on the pooled connection. */
  defaultPooled?: boolean;
  /** Force the pooled/direct toggle; defaults to on when both kinds exist. */
  poolable?: boolean;
  /** Notified when the role, database, or mode changes. */
  onSelectionChange?: (selection: ConnectionSelection) => void;
  isLoading?: boolean;
};

const cardClassName =
  "flex w-full min-w-0 flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 shadow-none ring-0";

const LoadingCard = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    aria-busy="true"
    className={cn(cardClassName, className)}
    data-slot="db-connection-card"
    {...props}
  >
    <div className="flex items-center justify-between gap-3">
      <Skeleton aria-hidden="true" className="h-4 w-32" />
      <Skeleton aria-hidden="true" className="h-6 w-28" />
    </div>
    <Skeleton aria-hidden="true" className="h-6 w-40" />
    <Skeleton aria-hidden="true" className="h-9 w-full" />
  </div>
);

export const DBConnectionCard = ({
  label = "Database connection",
  connections,
  roles,
  databases,
  defaultRole,
  defaultDatabase,
  defaultPooled = false,
  poolable,
  onSelectionChange,
  isLoading = false,
  className,
  ...props
}: DBConnectionCardProps) => {
  const roleOptions = roles ?? unique(connections.map((entry) => entry.role));
  const databaseOptions =
    databases ?? unique(connections.map((entry) => entry.database));
  const showToggle =
    poolable ??
    (connections.some((entry) => entry.pooled) &&
      connections.some((entry) => !entry.pooled));

  const [role, setRole] = useState(defaultRole ?? roleOptions[0] ?? "");
  const [database, setDatabase] = useState(
    defaultDatabase ?? databaseOptions[0] ?? ""
  );
  const [pooled, setPooled] = useState(defaultPooled);
  const [revealed, setRevealed] = useState(false);
  const [format, setFormat] = useState<ConnectionFormat>("uri");

  const commit = (next: ConnectionSelection) => {
    setRole(next.role);
    setDatabase(next.database);
    setPooled(next.pooled);
    onSelectionChange?.(next);
  };

  if (isLoading) {
    return <LoadingCard className={className} {...props} />;
  }

  const selection: ConnectionSelection = { database, pooled, role };
  const uri = connections.find((entry) => matches(entry, selection))?.uri ?? "";
  const psql = uri ? `psql '${uri}'` : "";
  const params = uri ? parseParams(uri) : null;
  const agentPrompt = buildAgentPrompt(params, pooled);
  const secret = <UriText revealed={revealed} uri={uri} />;

  return (
    <TooltipProvider>
      <div
        className={cn(cardClassName, className)}
        data-pooled={pooled || undefined}
        data-slot="db-connection-card"
        {...props}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="truncate font-medium text-foreground text-sm">
            {label}
          </p>
          {showToggle ? (
            <ModeToggle
              onSelect={(next) => commit({ ...selection, pooled: next })}
              pooled={pooled}
            />
          ) : null}
        </div>

        <SelectorRow
          database={database}
          databaseOptions={databaseOptions}
          onDatabase={(next) => commit({ ...selection, database: next })}
          onRole={(next) => commit({ ...selection, role: next })}
          role={role}
          roleOptions={roleOptions}
        />

        <FormatTabs
          agentPrompt={agentPrompt}
          format={format}
          onFormat={setFormat}
          onToggleReveal={() => setRevealed((current) => !current)}
          params={params}
          psql={psql}
          revealed={revealed}
          secret={secret}
          uri={uri}
        />
      </div>
    </TooltipProvider>
  );
};
