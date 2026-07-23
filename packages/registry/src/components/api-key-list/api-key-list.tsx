"use client";

import {
  Alert02Icon,
  Building01Icon,
  Copy01Icon,
  Delete02Icon,
  Key01Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import type { ComponentProps, FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const COPY_FLASH_MS = 1500;

/** Where the key lives: a personal account key or an organization key. */
export type ApiKeyScope = "personal" | "organization";

export interface ApiKey {
  id: string;
  name: string;
  scope: ApiKeyScope;
  /** Preformatted creation date, e.g. "Jul 12, 2026". */
  createdAt: string;
  /** Preformatted last use, e.g. "2h ago". Omit for a never-used key. */
  lastUsedAt?: string;
}

const SCOPE_ICON = {
  organization: Building01Icon,
  personal: Key01Icon,
} as const;

const SCOPE_SUBLABEL: Record<ApiKeyScope, string> = {
  organization: "Organization",
  personal: "Personal",
};

const SCOPES: { value: ApiKeyScope; label: string }[] = [
  { label: "personal", value: "personal" },
  { label: "org", value: "organization" },
];

/* ─────────────────────────────────────────────────────────
 * A copy that carries the real token and flashes a primary
 * check, announcing through a polite live region. The
 * "Copied" note masks the value under a gradient so the row
 * never breaks.
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
      <Tooltip>
        <TooltipTrigger
          render={
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
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <span aria-live="polite" className="sr-only">
        {copied ? `${label} copied` : ""}
      </span>
    </div>
  );
};

const ScopeToggle = ({
  scope,
  onSelect,
}: {
  scope: ApiKeyScope;
  onSelect: (scope: ApiKeyScope) => void;
}) => (
  <fieldset className="m-0 inline-flex shrink-0 rounded-md border border-border/60 p-0.5">
    <legend className="sr-only">Key scope</legend>
    {SCOPES.map((entry) => (
      <button
        aria-pressed={scope === entry.value}
        className={cn(
          "rounded-[calc(var(--radius-md)-3px)] px-2 py-0.5 font-mono text-[11px] transition-colors",
          scope === entry.value
            ? "bg-primary/10 font-medium text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
        key={entry.value}
        onClick={() => onSelect(entry.value)}
        type="button"
      >
        {entry.label}
      </button>
    ))}
  </fieldset>
);

type ScopeFilterValue = ApiKeyScope | "all";

const ScopeFilter = ({
  value,
  onChange,
}: {
  value: ScopeFilterValue;
  onChange: (value: ScopeFilterValue) => void;
}) => (
  <Select
    onValueChange={(next) => {
      if (next !== null) {
        onChange(next as ScopeFilterValue);
      }
    }}
    value={value}
  >
    <SelectTrigger
      aria-label="Filter by scope"
      className="h-7 rounded-md border-border/60 bg-muted/20 font-mono text-xs transition-colors hover:border-border hover:bg-muted/40"
      size="sm"
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem className="font-mono text-xs" value="all">
        all
      </SelectItem>
      <SelectItem className="font-mono text-xs" value="personal">
        personal
      </SelectItem>
      <SelectItem className="font-mono text-xs" value="organization">
        org
      </SelectItem>
    </SelectContent>
  </Select>
);

/* The one-time reveal: the full token, a copy, and a warning that it
 * will never be shown again. Recessed well so it reads as a secret. */
const RevealOncePanel = ({
  name,
  secret,
  onDone,
}: {
  name: string;
  secret: string;
  onDone: () => void;
}) => (
  <div
    className="fade-in-0 slide-in-from-top-1 animate-in space-y-2 rounded-md border border-primary/30 bg-background p-3 duration-200 motion-reduce:animate-none"
    data-slot="api-key-reveal"
  >
    <div className="flex items-center gap-2 text-primary">
      <HugeiconsIcon className="size-3.5" icon={Tick02Icon} strokeWidth={2} />
      <p className="min-w-0 truncate font-medium text-xs">{name} created</p>
    </div>
    <div className="flex min-w-0 items-center gap-1 rounded-md border border-border/60 bg-card py-1.5 pr-1 pl-2.5">
      <code className="min-w-0 flex-1 truncate font-mono text-[11px]">
        {secret}
      </code>
      <CopyButton label="Copy API key" value={secret} />
    </div>
    <div className="flex items-center justify-between gap-2">
      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <HugeiconsIcon
          className="size-3 shrink-0"
          icon={Alert02Icon}
          strokeWidth={2}
        />
        Copy it now. You will not see this key again.
      </p>
      <Button className="shrink-0" onClick={onDone} size="xs" variant="ghost">
        Done
      </Button>
    </div>
  </div>
);

const CreateForm = ({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: (name: string, scope: ApiKeyScope) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<ApiKeyScope>("personal");

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (name.trim()) {
      onSubmit(name.trim(), scope);
    }
  };

  return (
    <form
      className="fade-in-0 slide-in-from-top-1 flex animate-in flex-wrap items-center gap-2 duration-200 motion-reduce:animate-none"
      onSubmit={submit}
    >
      <Input
        className="h-8 min-w-40 flex-1 rounded-md font-mono text-xs focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15"
        disabled={pending}
        onChange={(event) => setName(event.target.value)}
        placeholder="Key name"
        value={name}
      />
      <ScopeToggle onSelect={setScope} scope={scope} />
      <Button
        disabled={pending || name.trim().length === 0}
        size="sm"
        type="submit"
      >
        {pending ? "Creating\u2026" : "Create"}
      </Button>
      <Button
        disabled={pending}
        onClick={onCancel}
        size="sm"
        type="button"
        variant="ghost"
      >
        Cancel
      </Button>
    </form>
  );
};

const HOLD_MS = 1000;
const RELEASE_MS = 180;

/* Hold-to-confirm: a destructive fill sweeps left to right for HOLD_MS
 * (linear, it is progress), revealing a white copy of the label under the
 * same clip-path. Releasing early rewinds it. Pointer and keyboard both work.
 * Same grammar as the confirm-dialog. */
const HoldButton = ({
  label,
  onHold,
}: {
  label: string;
  onHold: () => void;
}) => {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef(0);

  const cancel = () => {
    window.clearTimeout(timerRef.current);
    setHolding(false);
  };

  const start = () => {
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      setHolding(false);
      onHold();
    }, HOLD_MS);
  };

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <Button
      className="relative select-none overflow-hidden border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
      data-holding={holding || undefined}
      onKeyDown={(event) => {
        if (event.repeat || !(event.key === "Enter" || event.key === " ")) {
          return;
        }

        event.preventDefault();

        if (!holding) {
          start();
        }
      }}
      onKeyUp={cancel}
      onPointerCancel={cancel}
      onPointerDown={start}
      onPointerLeave={cancel}
      onPointerUp={cancel}
      size="xs"
      type="button"
      variant="ghost"
    >
      <span className="relative">{label}</span>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-destructive text-destructive-foreground"
        style={{
          clipPath: holding ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
          transition: `clip-path ${holding ? HOLD_MS : RELEASE_MS}ms ${
            holding ? "linear" : "ease-out"
          }`,
        }}
      >
        {label}
      </span>
    </Button>
  );
};

const KeyRow = ({
  apiKey,
  revoking,
  onAskRevoke,
  onCancelRevoke,
  onRevoke,
}: {
  apiKey: ApiKey;
  revoking: boolean;
  onAskRevoke: () => void;
  onCancelRevoke: () => void;
  onRevoke: () => void;
}) => (
  <li
    className={cn(
      "group relative flex items-center gap-3 border-border/60 border-t py-3 transition-colors first:border-t-0 hover:bg-muted/20",
      // Hold the hover tint for the whole confirm so the mask matches.
      revoking && "bg-muted/20"
    )}
    data-slot="api-key-row"
  >
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground">
      <HugeiconsIcon
        className="size-3.5"
        icon={SCOPE_ICON[apiKey.scope]}
        strokeWidth={2}
      />
    </span>

    <div className="min-w-0 flex-1">
      <p className="truncate font-mono font-medium text-foreground text-sm">
        {apiKey.name}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
        {SCOPE_SUBLABEL[apiKey.scope]}
      </p>
    </div>

    <div className="shrink-0 text-right">
      <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
        {`created ${apiKey.createdAt}`}
      </p>
      <p className="text-[10px] text-muted-foreground/60">
        {apiKey.lastUsedAt ? `used ${apiKey.lastUsedAt}` : "never used"}
      </p>
    </div>

    <div className="flex shrink-0 justify-end">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={`Revoke ${apiKey.name}`}
              className="text-muted-foreground/40 transition-colors hover:text-destructive group-hover:text-muted-foreground/70"
              onClick={onAskRevoke}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          }
        />
        <TooltipContent>Revoke</TooltipContent>
      </Tooltip>
    </div>

    {revoking ? (
      <div className="fade-in-0 slide-in-from-right-2 absolute inset-y-0 right-0 flex animate-in items-center gap-1.5 bg-gradient-to-l from-[color-mix(in_srgb,var(--muted)_20%,var(--card))] via-[85%] via-[color-mix(in_srgb,var(--muted)_20%,var(--card))] to-transparent pl-16 duration-200 motion-reduce:animate-none">
        <Button onClick={onCancelRevoke} size="xs" variant="ghost">
          Cancel
        </Button>
        <HoldButton label="Hold to revoke" onHold={onRevoke} />
      </div>
    ) : null}
  </li>
);

export type ApiKeyListProps = Omit<
  ComponentProps<"div">,
  "children" | "onChange"
> & {
  /** The keys to list, in display order. */
  keys: ApiKey[];
  /**
   * Create a key of the chosen scope; return the full token to reveal once.
   * The create UI hides when omitted.
   */
  onCreate?: (name: string, scope: ApiKeyScope) => Promise<string> | string;
  /** Revoke a key. Receives the whole key so the scope is known. */
  onRevoke?: (key: ApiKey) => Promise<void> | void;
  /** Card title. */
  label?: string;
  isLoading?: boolean;
  error?: Error | string | null;
};

const cardClassName =
  "flex w-full min-w-0 flex-col rounded-lg border border-border/60 bg-card p-4 shadow-none ring-0";

const Header = ({
  label,
  actions,
}: {
  label: string;
  actions?: ComponentProps<"div">["children"];
}) => (
  <div className="flex items-center justify-between gap-3">
    <p className="font-medium text-foreground text-sm">{label}</p>
    {actions ? (
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    ) : null}
  </div>
);

const emptyMessage = (total: number, filter: ScopeFilterValue) => {
  if (total === 0) {
    return "No API keys yet.";
  }

  return `No ${filter === "organization" ? "organization" : "personal"} keys.`;
};

const HeaderActions = ({
  showFilter,
  filter,
  onFilter,
  showCreate,
  onCreate,
}: {
  showFilter: boolean;
  filter: ScopeFilterValue;
  onFilter: (value: ScopeFilterValue) => void;
  showCreate: boolean;
  onCreate: () => void;
}) => (
  <>
    {showFilter ? <ScopeFilter onChange={onFilter} value={filter} /> : null}
    {showCreate ? (
      <Button onClick={onCreate} size="sm">
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
        New key
      </Button>
    ) : null}
  </>
);

/**
 * Animate the body's height as it changes (create form opens, the reveal
 * panel appears, rows are added or revoked), so the card grows and shrinks
 * smoothly instead of jumping.
 */
const AnimatedHeight = ({ children }: { children: ReactNode }) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<number | null>(null);
  const [height, setHeight] = useState<number>();
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const inner = innerRef.current;

    if (!inner) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const next = inner.offsetHeight;

      if (lastRef.current !== null && lastRef.current !== next) {
        setAnimating(true);
      }

      lastRef.current = next;
      setHeight(next);
    });

    observer.observe(inner);
    lastRef.current = inner.offsetHeight;
    setHeight(inner.offsetHeight);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "transition-[height] duration-300 ease-out motion-reduce:transition-none",
        // Clip only while the height animates; let focus rings and shadows
        // show once it settles.
        animating ? "overflow-hidden" : "overflow-visible"
      )}
      onTransitionEnd={() => setAnimating(false)}
      style={{ height }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
};

const EmptyState = ({
  message,
  showHint,
}: {
  message: string;
  showHint: boolean;
}) => (
  <div className="rounded-md border border-border/60 border-dashed bg-background px-3 py-6 text-center">
    <p className="text-muted-foreground text-xs">{message}</p>
    {showHint ? (
      <p className="mt-1 text-[11px] text-muted-foreground/60">
        Create one to call the Neon API.
      </p>
    ) : null}
  </div>
);

export const ApiKeyList = ({
  keys,
  onCreate,
  onRevoke,
  label = "API keys",
  isLoading = false,
  error = null,
  className,
  ...props
}: ApiKeyListProps) => {
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{ name: string; secret: string }>();
  const [revokingId, setRevokingId] = useState<string>();
  const [filter, setFilter] = useState<ScopeFilterValue>("all");

  const handleCreate = async (name: string, scope: ApiKeyScope) => {
    if (!onCreate) {
      return;
    }

    setPending(true);

    try {
      const secret = await onCreate(name, scope);
      setCreated({ name, secret });
      setCreating(false);
    } finally {
      setPending(false);
    }
  };

  const handleRevoke = async (key: ApiKey) => {
    setRevokingId(undefined);
    await onRevoke?.(key);
  };

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        className={cn(cardClassName, className)}
        data-slot="api-key-list"
        {...props}
      >
        <Header label={label} />
        <div className="mt-3 space-y-3">
          <Skeleton aria-hidden="true" className="h-10 w-full" />
          <Skeleton aria-hidden="true" className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    const message = typeof error === "string" ? error : error.message;

    return (
      <div
        className={cn(cardClassName, className)}
        data-slot="api-key-list"
        role="alert"
        {...props}
      >
        <Header label={label} />
        <p className="mt-3 flex items-baseline gap-2 text-sm">
          <span className="font-mono text-destructive text-xs">error</span>
          <span className="text-foreground">{message}</span>
        </p>
      </div>
    );
  }

  const hasOrg = keys.some((key) => key.scope === "organization");
  const hasPersonal = keys.some((key) => key.scope === "personal");
  const showFilter = hasOrg && hasPersonal;
  const filtered =
    filter === "all" ? keys : keys.filter((key) => key.scope === filter);
  const showCreateButton = Boolean(onCreate) && !(creating || created);
  const showEmpty = filtered.length === 0 && !(creating || created);

  return (
    <div
      className={cn(cardClassName, className)}
      data-slot="api-key-list"
      {...props}
    >
      <TooltipProvider>
        <Header
          actions={
            <HeaderActions
              filter={filter}
              onCreate={() => setCreating(true)}
              onFilter={setFilter}
              showCreate={showCreateButton}
              showFilter={showFilter}
            />
          }
          label={label}
        />

        <AnimatedHeight>
          <div className="flex flex-col gap-3 pt-3">
            {creating ? (
              <CreateForm
                onCancel={() => setCreating(false)}
                onSubmit={handleCreate}
                pending={pending}
              />
            ) : null}

            {created ? (
              <RevealOncePanel
                name={created.name}
                onDone={() => setCreated(undefined)}
                secret={created.secret}
              />
            ) : null}

            {filtered.length > 0 ? (
              <ul>
                {filtered.map((apiKey) => (
                  <KeyRow
                    apiKey={apiKey}
                    key={apiKey.id}
                    onAskRevoke={() => setRevokingId(apiKey.id)}
                    onCancelRevoke={() => setRevokingId(undefined)}
                    onRevoke={() => handleRevoke(apiKey)}
                    revoking={revokingId === apiKey.id}
                  />
                ))}
              </ul>
            ) : null}

            {showEmpty ? (
              <EmptyState
                message={emptyMessage(keys.length, filter)}
                showHint={Boolean(onCreate) && keys.length === 0}
              />
            ) : null}
          </div>
        </AnimatedHeight>
      </TooltipProvider>
    </div>
  );
};
