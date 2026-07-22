"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Runs after the hold completes; the dialog closes itself. */
  onConfirm: () => void;
  /** One line naming the action, e.g. "Restore this checkpoint?". */
  title: string;
  /** What happens and what it costs — say it plainly. */
  description?: ReactNode;
  /** Label inside the hold action. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** How long the hold takes to arm, in milliseconds. */
  holdMs?: number;
  /**
   * The hold trembles as it approaches commitment — barely a shiver
   * at the start, unmistakable by the end. Off under reduced motion.
   */
  shake?: boolean;
}

/* ─────────────────────────────────────────────────────────
 * HOLD-TO-CONFIRM STORYBOARD
 *
 * A destructive action shouldn't be one twitch away. The
 * dialog asks; the hold answers.
 *
 *  open      overlay fades, the panel rises 8px
 *  rest      the action wears destructive as a border and
 *            text — armed, not fired
 *  hold      press and hold: a destructive fill sweeps
 *            left to right for exactly holdMs (linear —
 *            progress, not easing). The fill carries its
 *            own destructive-foreground copy of the label,
 *            revealed by the same clip-path, so the sweep
 *            edge crosses the letterforms — white behind
 *            it, destructive ahead of it, never a flip.
 *            With shake on, the button trembles harder as
 *            the fill closes in — amplitude eases from 0
 *            to 2.5px over the hold (ease-in: dread builds
 *            late), mixing axes so it reads as strain
 *  release   let go early and the fill springs back
 *            (180ms ease-out) — no harm done
 *  arm       the fill lands, onConfirm fires once, the
 *            dialog closes
 *  keyboard  holding Space or Enter works the same way;
 *            key repeat is ignored
 *
 * The clip-path label split was suggested by Gurbinder
 * (x.com/legionsdev).
 * ───────────────────────────────────────────────────────── */
const DEFAULT_HOLD_MS = 1200;
const RELEASE_MS = 180;
/** Peak tremble at the moment the hold arms — a shiver, not a quake. */
const SHAKE_MAX = "0.75px";
/**
 * The amplitude's ramp: flat for most of the hold, then it surges —
 * gradually, then suddenly.
 */
const SHAKE_EASE = "cubic-bezier(0.8, 0, 1, 1)";

export const ConfirmDialog = ({
  cancelLabel = "Cancel",
  confirmLabel = "Hold to confirm",
  description,
  holdMs = DEFAULT_HOLD_MS,
  onConfirm,
  onOpenChange,
  open,
  shake = true,
  title,
}: ConfirmDialogProps) => {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef(0);

  const cancelHold = () => {
    window.clearTimeout(timerRef.current);
    setHolding(false);
  };

  const startHold = () => {
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      setHolding(false);
      onConfirm();
      onOpenChange(false);
    }, holdMs);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.repeat || !(event.key === "Enter" || event.key === " ")) {
      return;
    }

    event.preventDefault();

    if (!holding) {
      startHold();
    }
  };

  /** Any close path cancels an in-flight hold first. */
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      cancelHold();
    }

    onOpenChange(next);
  };

  // Leave no timer behind on unmount.
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent data-slot="confirm-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            className="active:scale-[0.98]"
            onClick={() => handleOpenChange(false)}
            variant="ghost"
          >
            {cancelLabel}
          </Button>
          <Button
            className={cn(
              "relative select-none overflow-hidden rounded-md border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive focus-visible:border-destructive/60 focus-visible:ring-destructive/25 dark:focus-visible:ring-destructive/40",
              shake && holding && "neon-hold-shake"
            )}
            data-holding={holding || undefined}
            data-slot="confirm-dialog-hold"
            style={
              shake
                ? ({
                    "--neon-shake-amp": holding ? SHAKE_MAX : "0px",
                    transition: `--neon-shake-amp ${
                      holding ? holdMs : RELEASE_MS
                    }ms ${holding ? SHAKE_EASE : "ease-out"}`,
                  } as CSSProperties)
                : undefined
            }
            onKeyDown={handleKeyDown}
            onKeyUp={cancelHold}
            onPointerCancel={cancelHold}
            onPointerDown={startHold}
            onPointerLeave={cancelHold}
            onPointerUp={cancelHold}
            variant="ghost"
          >
            <span className="relative">{confirmLabel}</span>
            {/* The progress fill and its own white copy of the label,
                revealed together by one clip-path — the sweep edge
                crosses the letterforms instead of flipping the text. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center bg-destructive text-destructive-foreground"
              data-slot="confirm-dialog-hold-fill"
              style={{
                clipPath: holding ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                transition: `clip-path ${holding ? holdMs : RELEASE_MS}ms ${
                  holding ? "linear" : "ease-out"
                }`,
              }}
            >
              {confirmLabel}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
