"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "./confirm-dialog";
import { deleteConfirm } from "./fixtures";

export const ConfirmDialogDemo = () => {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        className="active:scale-[0.98]"
        onClick={() => {
          setConfirmed(false);
          setOpen(true);
        }}
        variant="outline"
      >
        Delete app
      </Button>
      {confirmed ? (
        <p className="fade-in-0 animate-in font-mono text-muted-foreground text-xs duration-300 motion-reduce:animate-none">
          deleted
        </p>
      ) : null}
      <ConfirmDialog
        confirmLabel={deleteConfirm.confirmLabel}
        description={deleteConfirm.description}
        onConfirm={() => setConfirmed(true)}
        onOpenChange={setOpen}
        open={open}
        title={deleteConfirm.title}
      />
    </div>
  );
};

export default ConfirmDialogDemo;
