interface PackageManagerCommands {
  pnpm: string;
  yarn: string;
  npm: string;
  bun: string;
  shadcn?: string;
}

const SHADCN_COMMAND_PATTERN =
  /^npx\s+shadcn(?:@(?<version>\S+))?\s+(?<subcommand>.+)$/u;
const CREATE_COMMAND_PATTERN = /^npx\s+create-(?<initializer>.+)$/u;

const replaceNpmPrefix = (command: string, prefix: string): string => {
  if (!command.startsWith("npm ")) {
    return command;
  }

  return `${prefix} ${command.slice("npm ".length)}`;
};

export const convertNpmCommand = (
  npmCommand: string
): PackageManagerCommands => {
  const trimmed = npmCommand.trim();

  const shadcnMatch = trimmed.match(SHADCN_COMMAND_PATTERN);
  const subcommand = shadcnMatch?.groups?.subcommand;
  if (subcommand) {
    const npxArgs = trimmed.slice("npx ".length);
    const runners: PackageManagerCommands = {
      bun: `bunx --bun ${npxArgs}`,
      npm: trimmed,
      pnpm: `pnpm dlx ${npxArgs}`,
      yarn: `yarn dlx ${npxArgs}`,
    };

    const version = shadcnMatch?.groups?.version;
    if (version !== undefined && version !== "latest") {
      return runners;
    }

    return { ...runners, shadcn: `shadcn ${subcommand}` };
  }

  // npx create-<name> → pnpm create <name> / yarn create <name> / bunx --bun create-<name>
  const createMatch = trimmed.match(CREATE_COMMAND_PATTERN);
  const initializer = createMatch?.groups?.initializer;
  if (initializer) {
    return {
      bun: `bunx --bun create-${initializer}`,
      npm: trimmed,
      pnpm: `pnpm create ${initializer}`,
      yarn: `yarn create ${initializer}`,
    };
  }

  // npm create → pnpm create / yarn create / bun create
  if (trimmed.startsWith("npm create ")) {
    const rest = trimmed.slice("npm create ".length);
    return {
      bun: `bun create ${rest}`,
      npm: trimmed,
      pnpm: `pnpm create ${rest}`,
      yarn: `yarn create ${rest}`,
    };
  }

  // npx → pnpm dlx / yarn / bunx --bun
  if (trimmed.startsWith("npx ")) {
    const rest = trimmed.slice("npx ".length);
    return {
      bun: `bunx --bun ${rest}`,
      npm: trimmed,
      pnpm: `pnpm dlx ${rest}`,
      yarn: `yarn ${rest}`,
    };
  }

  // npm run → pnpm / yarn / bun
  if (trimmed.startsWith("npm run ")) {
    const rest = trimmed.slice("npm run ".length);
    return {
      bun: `bun ${rest}`,
      npm: trimmed,
      pnpm: `pnpm ${rest}`,
      yarn: `yarn ${rest}`,
    };
  }

  // npm install → pnpm add / yarn add / bun add
  const installPrefix = trimmed.startsWith("npm install ")
    ? "npm install "
    : "npm i ";
  if (trimmed.startsWith(installPrefix)) {
    const rest = trimmed.slice(installPrefix.length);
    return {
      bun: `bun add ${rest}`,
      npm: trimmed,
      pnpm: `pnpm add ${rest}`,
      yarn: `yarn add ${rest}`,
    };
  }

  // Fallback
  return {
    bun: replaceNpmPrefix(trimmed, "bun"),
    npm: trimmed,
    pnpm: replaceNpmPrefix(trimmed, "pnpm"),
    yarn: replaceNpmPrefix(trimmed, "yarn"),
  };
};
