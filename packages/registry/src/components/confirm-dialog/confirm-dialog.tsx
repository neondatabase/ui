"use client";

import type { KeyboardEvent, ReactNode } from "react";
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
 *            it, destructive ahead of it, never a flip
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

export const ConfirmDialog = ({
  cancelLabel = "Cancel",
  confirmLabel = "Hold to confirm",
  description,
  holdMs = DEFAULT_HOLD_MS,
  onConfirm,
  onOpenChange,
  open,
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
            className="relative select-none overflow-hidden border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
            data-holding={holding || undefined}
            data-slot="confirm-dialog-hold"
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
