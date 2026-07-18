/* oxlint-disable import/no-duplicates -- the ?raw import pulls source text, not the module */
import { Tabs } from "@base-ui/react/tabs";
import { Button } from "@neon-ui/registry/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import AuthFormCoverDemo from "./auth-form-cover-demo";
import source from "./auth-form-cover-demo.tsx?raw";

const triggerClass =
  "relative h-11 px-4 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground data-[active]:text-foreground data-[active]:after:absolute data-[active]:after:inset-x-3 data-[active]:after:bottom-0 data-[active]:after:h-0.5 data-[active]:after:bg-primary";

export default function AuthFormCoverPreview() {
  const [copied, setCopied] = useState(false);

  const copySource = async () => {
    await navigator.clipboard.writeText(source.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tabs.Root
      className="overflow-hidden border border-border/60 bg-background"
      defaultValue="preview"
    >
      <Tabs.List aria-label="Component preview" className="flex bg-muted/15">
        <Tabs.Tab className={triggerClass} value="preview">
          Preview
        </Tabs.Tab>
        <Tabs.Tab className={triggerClass} value="code">
          Code
        </Tabs.Tab>
      </Tabs.List>

      <div className="relative isolate border-t border-border/60">
        <Tabs.Panel
          className="not-prose bg-muted/10 p-4 preview-ghost outline-none"
          keepMounted
          value="preview"
        >
          <AuthFormCoverDemo />
        </Tabs.Panel>
        <Tabs.Panel
          className="not-prose absolute inset-0 overflow-hidden code-overlay outline-none"
          keepMounted
          value="code"
        >
          <Button
            aria-label="Copy source"
            className="absolute top-3 right-3"
            onClick={copySource}
            size="icon-sm"
            variant="ghost"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
          <div className="h-full overflow-auto bg-muted/30 p-5 text-xs leading-5">
            <code className="block whitespace-pre font-mono">
              {source.trim()}
            </code>
          </div>
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  );
}
