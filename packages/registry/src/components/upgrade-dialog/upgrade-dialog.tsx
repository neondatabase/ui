"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface UpgradePlan {
  /** Plan name, e.g. "Launch". */
  name: string;
  /** Monthly price in dollars. */
  price: number;
  /** What the plan unlocks, in display order. */
  features: string[];
  /** One quiet line under the action, e.g. billing terms. */
  note?: string;
}

export interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Starts the upgrade; drive isProcessing while it flies. */
  onUpgrade: () => void;
  plan: UpgradePlan;
  /** Locks the dialog and shimmers the action label. */
  isProcessing?: boolean;
  /** Structured failure spoken through the description slot. */
  error?: string | null;
  title?: string;
  description?: ReactNode;
}

/* ─────────────────────────────────────────────────────────
 * UPGRADE STORYBOARD
 *
 *  open        the panel rises; the price answers first
 *              (number large, cadence mono), then the
 *              checklist introduces itself one line at a
 *              time, 50ms apart, each check drawing in
 *  action      the CTA arrives already charged — neon fill
 *              and the house glow; this is the one place
 *              the color was always going
 *  processing  everything locks; the label shimmers
 *              ("Upgrading…") until the flight lands and
 *              the parent closes the dialog
 *  error       the description slot speaks the failure in
 *              destructive — same row, zero shift
 * ───────────────────────────────────────────────────────── */
const FEATURE_STAGGER_MS = 50;

const RISE =
  "fill-mode-backwards fade-in-0 slide-in-from-bottom-2 animate-in duration-500 motion-reduce:animate-none";

const CTA_GLOW =
  "shadow-[0_0_20px_-6px_var(--primary)] hover:shadow-[0_0_30px_-6px_var(--primary)]";

const FeatureRow = ({ feature, index }: { feature: string; index: number }) => (
  <li
    className={cn("flex items-center gap-2.5 text-foreground/90 text-sm", RISE)}
    style={{ animationDelay: `${index * FEATURE_STAGGER_MS}ms` }}
  >
    <svg
      aria-hidden="true"
      className="size-3.5 shrink-0 text-primary"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        className="neon-check-draw"
        d="M4 12.5 10 18.5 20 6"
        pathLength={1}
      />
    </svg>
    {feature}
  </li>
);

export const UpgradeDialog = ({
  description,
  error = null,
  isProcessing = false,
  onOpenChange,
  onUpgrade,
  open,
  plan,
  title,
}: UpgradeDialogProps) => {
  const heading = title ?? `Upgrade to ${plan.name}`;

  const handleOpenChange = (next: boolean) => {
    if (isProcessing) {
      return;
    }

    onOpenChange(next);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent data-slot="upgrade-dialog">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription
            className={cn(error && "text-destructive")}
            data-slot={error ? "upgrade-dialog-error" : undefined}
            key={error ?? "description"}
            role={error ? "alert" : undefined}
          >
            {error ??
              description ??
              "Your app moves to a dedicated Neon project with more compute."}
          </DialogDescription>
        </DialogHeader>

        <p
          className="flex items-baseline gap-1.5"
          data-slot="upgrade-dialog-price"
        >
          <span className="font-semibold text-3xl text-foreground tabular-nums tracking-tight">
            ${plan.price}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            / month
          </span>
        </p>

        <ul className="flex flex-col gap-2" data-slot="upgrade-dialog-features">
          {plan.features.map((feature, index) => (
            <FeatureRow feature={feature} index={index} key={feature} />
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <Button
            className={cn(
              "w-full active:scale-[0.98] disabled:opacity-100 motion-reduce:active:scale-100",
              CTA_GLOW
            )}
            disabled={isProcessing}
            onClick={onUpgrade}
          >
            <span key={String(isProcessing)}>
              <span
                className={cn("block", {
                  "shimmer shimmer-duration-2400": isProcessing,
                })}
              >
                {isProcessing ? "Upgrading…" : `Upgrade to ${plan.name}`}
              </span>
            </span>
          </Button>
          <Button
            className="w-full"
            disabled={isProcessing}
            onClick={() => handleOpenChange(false)}
            variant="ghost"
          >
            Not now
          </Button>
        </div>

        {plan.note ? (
          <p className="text-center font-mono text-[10px] text-muted-foreground/70">
            {plan.note}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
