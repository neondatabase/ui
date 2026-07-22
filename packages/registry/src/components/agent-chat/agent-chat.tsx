"use client";

import {
  ArrowRight01Icon,
  Loading03Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ChatStatus, UIMessage } from "ai";
import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import type {
  ComponentProps,
  FormEvent,
  KeyboardEvent,
  ReactNode,
} from "react";
import { useCallback, useRef, useState } from "react";
import { Streamdown } from "streamdown";

import { EmptyState } from "@/components/empty-state/empty-state";
import { NeonMarkShimmer } from "@/components/neon-loader/neon-loader";
import { ToolCallChip } from "@/components/tool-call-chip/tool-call-chip";
import type { ToolCallState } from "@/components/tool-call-chip/tool-call-chip";
import { Button } from "@/components/ui/button";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
 * BLOCK STORYBOARD
 *
 * A full agent chat pane.
 *
 *  entrance   each new turn rises 8px on a quick spring
 *  rhythm     a reply sits tight under its prompt; turns
 *             breathe with more air between exchanges
 *  streaming  the scroller follows while pinned, backs off
 *             when the reader scrolls up, and offers a
 *             jump-to-latest button
 *  busy       the Neon mark and status line shimmer in sync
 *             "Agent is working" until tokens arrive
 *  switches   a user turn whose metadata carries a new
 *             model/effort gets a quiet "switched to"
 *             marker above it
 *  composer   flush foot of the pane: textarea on top,
 *             model controls + send below, the top border
 *             warms to primary on focus
 * ───────────────────────────────────────────────────────── */
const TURN_SPRING = {
  damping: 32,
  stiffness: 420,
  type: "spring" as const,
};

const TURN_RISE_PX = 8;

/** Rises new turns in; static under reduced motion. */
const TurnEntrance = ({ children }: { children: ReactNode }) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div>{children}</div>;
  }

  return (
    <m.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: TURN_RISE_PX }}
      transition={TURN_SPRING}
    >
      {children}
    </m.div>
  );
};

/** Attach to user turns via sendMessage metadata to record the controls used. */
export interface AgentChatTurnMetadata {
  /** Model id, e.g. "gpt-5-2". */
  model?: string;
  /** Display name for the marker, e.g. "GPT-5.2". Falls back to model. */
  modelName?: string;
  /** Reasoning effort used for the turn. */
  effort?: string;
}

const turnMetadata = (message: UIMessage): AgentChatTurnMetadata | null => {
  const { metadata } = message;

  if (metadata && typeof metadata === "object" && "model" in metadata) {
    return metadata as AgentChatTurnMetadata;
  }

  return null;
};

/** "switched to GPT-5.2 · high thinking" when a turn changes controls. */
const switchLabel = (
  current: AgentChatTurnMetadata,
  previous: AgentChatTurnMetadata | null
): string | null => {
  const modelChanged =
    previous !== null && current.model !== undefined
      ? current.model !== previous.model
      : false;
  const effortChanged =
    previous !== null && current.effort !== undefined
      ? current.effort !== previous.effort
      : false;

  if (!(modelChanged || effortChanged)) {
    return null;
  }

  const name = current.modelName ?? current.model ?? "";
  const effort =
    current.effort && current.effort !== "off"
      ? ` · ${current.effort} thinking`
      : "";

  return `switched to ${name}${effort}`;
};

const chipState = (state: string): ToolCallState => {
  if (state === "output-error") {
    return "error";
  }

  return state === "output-available" ? "done" : "running";
};

type Part = UIMessage["parts"][number];

/**
 * A finished turn has no running tools. History-hydrated parts don't carry
 * the live stream's state strings, so anything still "running" in a settled
 * message is actually done.
 */
const settleTools = (tools: ToolEntry[]): ToolEntry[] =>
  tools.map((tool) =>
    tool.state === "running" ? { ...tool, state: "done" } : tool
  );

export interface ToolEntry {
  detail?: string;
  name: string;
  state: ToolCallState;
}

type Segment =
  | { kind: "text"; text: string }
  | { kind: "reasoning"; text: string }
  | { kind: "tools"; tools: ToolEntry[] };

/** First string value of a tool's input, e.g. the path or command. */
const toolDetail = (part: Part): string | undefined => {
  if (!("input" in part) || typeof part.input !== "object" || !part.input) {
    return undefined;
  }

  return Object.values(part.input).find(
    (value): value is string => typeof value === "string"
  );
};

/** Fold message parts into render segments, grouping tool runs. */
const segmentParts = (parts: Part[]): Segment[] => {
  const segments: Segment[] = [];

  for (const part of parts) {
    if (part.type === "text") {
      segments.push({ kind: "text", text: part.text });
      continue;
    }

    if (part.type === "reasoning") {
      segments.push({ kind: "reasoning", text: part.text });
      continue;
    }

    let tool: ToolEntry | null = null;

    if (part.type === "dynamic-tool") {
      tool = {
        detail: toolDetail(part),
        name: part.toolName,
        state: chipState(part.state),
      };
    } else if (part.type.startsWith("tool-") && "state" in part) {
      tool = {
        detail: toolDetail(part),
        name: part.type.slice("tool-".length),
        state: chipState(String(part.state)),
      };
    }

    if (tool) {
      const last = segments.at(-1);

      if (last?.kind === "tools") {
        last.tools.push(tool);
      } else {
        segments.push({ kind: "tools", tools: [tool] });
      }
    }
  }

  return segments;
};

/* ─────────────────────────────────────────────────────
 * A run of tool calls folded into one working block: while any
 * call is live the header shimmers ("Working…") and the log is
 * open; when the run lands it collapses to a one-line receipt
 * ("n steps") the reader can reopen. The chips inside stay the
 * house log-line vocabulary.
 * ─────────────────────────────────────────────────── */
export const ToolGroup = ({
  tools,
  live = false,
}: {
  tools: ToolEntry[];
  /** The turn is still streaming — hold open across gaps between calls. */
  live?: boolean;
}) => {
  const running = tools.some((tool) => tool.state === "running");
  // "Working" for the entire live turn: between tool calls every chip is
  // momentarily settled, and folding in those gaps reads as a glitch.
  const working = live || running;
  const failed = tools.filter((tool) => tool.state === "error").length;
  // User toggle wins; otherwise open while working, closed at rest.
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? working;

  const summary = working
    ? "Working…"
    : `${tools.length} step${tools.length === 1 ? "" : "s"}${failed > 0 ? ` · ${failed} failed` : ""}`;

  return (
    <div
      className="border-border/60 border-l-2 pl-2.5"
      data-slot="tool-group"
      data-state={working ? "working" : "done"}
    >
      <button
        aria-expanded={open}
        className="group inline-flex items-center gap-1 py-0.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
        onClick={() => setUserOpen(!open)}
        type="button"
      >
        <HugeiconsIcon
          aria-hidden
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className={cn(
            "size-3 transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-90"
          )}
        />
        {working ? (
          <span className="shimmer shimmer-duration-2400">{summary}</span>
        ) : (
          <span>{summary}</span>
        )}
      </button>
      {open && (
        <div className="mt-1 flex flex-col items-start gap-1 pb-0.5">
          {tools.map((tool, toolIndex) => (
            <ToolCallChip
              detail={tool.detail}
              key={`${tool.name}-${toolIndex.toString()}`}
              name={tool.name}
              state={tool.state}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/** Explicit markdown styling — no typography plugin required. */
const MARKDOWN_CLASS = cn(
  "text-sm leading-relaxed",
  "[&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0",
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:font-semibold [&_h1]:text-base",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-semibold [&_h2]:text-sm",
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-medium [&_h3]:text-sm",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5",
  "[&_code]:bg-muted/60 [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.85em]",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border/60 [&_pre]:bg-muted/30 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_blockquote]:my-2 [&_blockquote]:border-border/60 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
  "[&_strong]:font-semibold"
);

export type ChatMessageProps = Omit<ComponentProps<"div">, "children"> & {
  message: UIMessage;
  /**
   * The turn is still streaming: tool groups hold open for the whole run
   * instead of folding in the gaps between calls.
   */
  isLive?: boolean;
};

/** One conversation turn: user bubble or agent markdown with tool chips. */
export const ChatMessage = ({
  className,
  message,
  isLive = false,
  ...props
}: ChatMessageProps) => {
  if (message.role === "user") {
    const text = message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");

    return (
      <div
        className={cn("flex justify-end", className)}
        data-role="user"
        {...props}
      >
        <div className="max-w-[85%] whitespace-pre-wrap bg-primary px-3 py-2 text-primary-foreground text-sm">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-2.5", className)}
      data-role="assistant"
      {...props}
    >
      {segmentParts(message.parts).map((segment, index) => {
        const key = `${message.id}-${index.toString()}`;

        if (segment.kind === "reasoning") {
          return (
            <p
              className="border-border/60 border-l-2 pl-2.5 text-muted-foreground/80 text-xs leading-relaxed"
              key={key}
            >
              {segment.text}
            </p>
          );
        }

        if (segment.kind === "tools") {
          const tools = isLive ? segment.tools : settleTools(segment.tools);
          // One call is a log line, not a folder.
          if (tools.length === 1 && tools[0]) {
            return (
              <div className="border-border/60 border-l-2 pl-2.5" key={key}>
                <ToolCallChip
                  detail={tools[0].detail}
                  name={tools[0].name}
                  state={tools[0].state}
                />
              </div>
            );
          }
          return <ToolGroup key={key} live={isLive} tools={tools} />;
        }

        return (
          <div className={MARKDOWN_CLASS} key={key}>
            <Streamdown>{segment.text}</Streamdown>
          </div>
        );
      })}
    </div>
  );
};

const autoGrow = (event: FormEvent<HTMLTextAreaElement>) => {
  const textarea = event.currentTarget;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
};

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  busy?: boolean;
  placeholder?: string;
  /** Slot at the left of the composer's control row, e.g. ThinkingModelSelect. */
  controls?: ReactNode;
  className?: string;
}

/** Composer: auto-growing textarea, controls slot, and a send action. */
export const ChatInput = ({
  busy = false,
  className,
  controls,
  disabled = false,
  onSend,
  placeholder = "Describe a change…",
}: ChatInputProps) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const trimmed = text.trim();

    if (!trimmed || busy || disabled) {
      return;
    }

    onSend(trimmed);
    setText("");

    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = "auto";
      textarea.focus();
    }
  }, [busy, disabled, onSend, text]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div
      className={cn(
        "border-border/60 border-t bg-card transition-colors focus-within:border-primary/50",
        disabled && "opacity-60",
        className
      )}
      data-slot="chat-input"
    >
      <textarea
        aria-label="Message the agent"
        className="block max-h-40 w-full resize-none bg-transparent px-3.5 pt-3 pb-1.5 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        onInput={autoGrow}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={text}
      />
      <div className="flex items-end justify-between gap-2 px-2.5 pb-2.5">
        <div className="flex min-w-0 items-center gap-2">{controls}</div>
        <Button
          aria-label={busy ? "Waiting for the agent" : "Send message"}
          className="shrink-0"
          disabled={disabled || busy || text.trim().length === 0}
          onClick={submit}
          size="icon-sm"
        >
          {busy ? (
            <HugeiconsIcon
              className="animate-spin"
              icon={Loading03Icon}
              strokeWidth={2}
            />
          ) : (
            <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
          )}
        </Button>
      </div>
    </div>
  );
};

const DefaultEmptyState = () => (
  <EmptyState
    className="h-full py-10"
    description="Describe a feature and the agent edits the live app, database included."
    title="Start building"
  />
);

export type ChatWorkingIndicatorProps = ComponentProps<"div"> & {
  /** Status line beside the resolving Neon mark. */
  label?: string;
};

/** The busy row: the Neon mark and a status line sharing one shimmer sweep. */
export const ChatWorkingIndicator = ({
  className,
  label = "Agent is working\u2026",
  ...props
}: ChatWorkingIndicatorProps) => (
  <div
    aria-live="polite"
    className={cn(
      "flex items-center gap-2 text-muted-foreground text-xs",
      className
    )}
    data-slot="chat-working-indicator"
    {...props}
  >
    <NeonMarkShimmer className="text-primary" size={14} />
    <span className="shimmer">{label}</span>
  </div>
);

export type AgentChatProps = Omit<ComponentProps<"div">, "children"> & {
  messages: UIMessage[];
  /** useChat status: "submitted" | "streaming" | "ready" | "error". */
  status: ChatStatus;
  onSend: (text: string) => void;
  /** Disable the composer, e.g. while an environment provisions. */
  disabled?: boolean;
  placeholder?: string;
  /** Rendered while the conversation is empty. */
  emptyState?: ReactNode;
  /** Slot at the left of the composer's control row. */
  controls?: ReactNode;
  /**
   * The controls currently selected in the composer. When they differ from
   * the last sent turn's metadata, a "switched to" marker previews at the
   * end of the timeline immediately.
   */
  activeControls?: AgentChatTurnMetadata;
  /** Shown in the error state; called to resend the last message. */
  onRetry?: () => void;
};

export const AgentChat = ({
  activeControls,
  className,
  controls,
  disabled = false,
  emptyState,
  messages,
  onRetry,
  onSend,
  placeholder,
  status,
  ...props
}: AgentChatProps) => {
  const busy = status === "submitted" || status === "streaming";
  const lastUserIndex = messages.findLastIndex(
    (message) => message.role === "user"
  );
  const lastUserMetadata =
    lastUserIndex !== -1 && messages[lastUserIndex]
      ? turnMetadata(messages[lastUserIndex])
      : null;
  const pendingSwitch =
    activeControls && lastUserMetadata
      ? switchLabel(activeControls, lastUserMetadata)
      : null;

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className={cn("flex min-h-0 flex-col", className)}
        data-slot="agent-chat"
        {...props}
      >
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="relative min-h-0 flex-1">
            <MessageScrollerViewport className="neon-scroll-fade h-full">
              <MessageScrollerContent className="p-4">
                {messages.length === 0 && (emptyState ?? <DefaultEmptyState />)}
                {messages.map((message, index) => {
                  let marker: string | null = null;

                  if (message.role === "user") {
                    const metadata = turnMetadata(message);
                    const previous = messages
                      .slice(0, index)
                      .findLast((entry) => entry.role === "user");

                    if (metadata) {
                      marker = switchLabel(
                        metadata,
                        previous ? turnMetadata(previous) : null
                      );
                    }
                  }

                  return (
                    <MessageScrollerItem
                      className={cn(
                        message.role === "user"
                          ? "mt-6 first:mt-0"
                          : "mt-3 first:mt-0"
                      )}
                      key={message.id}
                      scrollAnchor={index === lastUserIndex}
                    >
                      <TurnEntrance>
                        {marker ? (
                          <Marker className="mb-3" variant="separator">
                            <MarkerContent className="font-mono text-[10px]">
                              {marker}
                            </MarkerContent>
                          </Marker>
                        ) : null}
                        <ChatMessage
                          isLive={busy && index === messages.length - 1}
                          message={message}
                        />
                      </TurnEntrance>
                    </MessageScrollerItem>
                  );
                })}
                {status === "submitted" && (
                  <ChatWorkingIndicator className="mt-3" />
                )}
                {pendingSwitch && !busy ? (
                  <TurnEntrance>
                    <Marker
                      aria-live="polite"
                      className="mt-3"
                      variant="separator"
                    >
                      <MarkerContent className="font-mono text-[10px]">
                        {pendingSwitch}
                      </MarkerContent>
                    </Marker>
                  </TurnEntrance>
                ) : null}
                {status === "error" && (
                  <div
                    className="mt-3 flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/[0.045] px-3 py-2"
                    role="alert"
                  >
                    <p className="text-destructive text-xs">
                      The agent hit an error. Your message wasn’t lost.
                    </p>
                    {onRetry ? (
                      <button
                        className="shrink-0 rounded-sm border border-border/60 px-2 py-1 text-foreground text-xs transition-colors hover:border-border"
                        onClick={onRetry}
                        type="button"
                      >
                        Retry
                      </button>
                    ) : null}
                  </div>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton className="-translate-x-1/2 absolute bottom-3 left-1/2" />
          </MessageScroller>
        </MessageScrollerProvider>

        <ChatInput
          busy={busy}
          className="shrink-0"
          controls={controls}
          disabled={disabled}
          onSend={onSend}
          placeholder={placeholder}
        />
      </div>
    </LazyMotion>
  );
};
