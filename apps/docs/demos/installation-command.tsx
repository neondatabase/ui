"use client";

import { CodeBlockCommand } from "@neon-ui/registry/components/code-block-command";
import type { PackageManager } from "@neon-ui/registry/components/code-block-command";
import { convertNpmCommand } from "@neon-ui/registry/lib/convert-npm-command";

const PACKAGE_MANAGER_ORDER: PackageManager[] = [
  "shadcn",
  "pnpm",
  "npm",
  "yarn",
  "bun",
];

interface InstallationCommandProps {
  command: string;
  className?: string;
}

export default function InstallationCommand({
  command,
  className = "my-4",
}: InstallationCommandProps) {
  return (
    <CodeBlockCommand
      {...convertNpmCommand(command)}
      className={className}
      show={PACKAGE_MANAGER_ORDER}
    />
  );
}
