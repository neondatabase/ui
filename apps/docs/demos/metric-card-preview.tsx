import { Tabs } from "@base-ui/react/tabs";
import { MetricCardDemo } from "@neon-ui/registry/components/metric-card/demo";
import { Button } from "@neon-ui/registry/components/ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import source from "../../../packages/registry/src/components/metric-card/demo.tsx?raw";

const triggerClass =
  "relative h-11 px-4 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground data-[active]:text-foreground data-[active]:after:absolute data-[active]:after:inset-x-3 data-[active]:after:bottom-0 data-[active]:after:h-0.5 data-[active]:after:bg-primary";

export default function MetricCardPreview() {
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
          className="not-prose flex min-h-[400px] items-center justify-center bg-muted/10 p-6 outline-none sm:p-8 preview-ghost"
          keepMounted
          value="preview"
        >
          <MetricCardDemo />
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
