import type { LogLine } from "./logs-viewer";

const RESET = "\u001B[0m";
const RED = "\u001B[31m";
const GREEN = "\u001B[32m";
const YELLOW = "\u001B[33m";
const CYAN = "\u001B[36m";
const BOLD = "\u001B[1m";
const DIM = "\u001B[2m";

const RAW: readonly (readonly [string, LogLine["level"], string])[] = [
  [
    "10:42:01.118",
    "info",
    `${GREEN}database system is ready to accept connections${RESET}`,
  ],
  ["10:42:01.940", "debug", `${DIM}checkpoint starting: time${RESET}`],
  [
    "10:42:02.104",
    "info",
    `connection received: host=${CYAN}10.0.14.22${RESET} port=54344`,
  ],
  [
    "10:42:02.267",
    "info",
    `connection authorized: user=${BOLD}app_owner${RESET} database=neondb SSL enabled`,
  ],
  [
    "10:42:03.512",
    "debug",
    `${DIM}parse <unnamed>: select id, email from users where id = $1${RESET}`,
  ],
  [
    "10:42:04.881",
    "warn",
    `${YELLOW}temporary file: path "base/pgsql_tmp/pgsql_tmp8321.0", size 4194304${RESET}`,
  ],
  [
    "10:42:05.220",
    "error",
    `${RED}duplicate key value violates unique constraint "users_email_key"${RESET}`,
  ],
  [
    "10:42:05.221",
    "error",
    `${DIM}detail: Key (email)=(ada@example.com) already exists.${RESET}`,
  ],
  ["10:42:06.003", "info", 'autovacuum: processing database "neondb"'],
  [
    "10:42:07.470",
    "warn",
    `${YELLOW}compute is approaching the autoscaling ceiling (7.4 of 8 CU)${RESET}`,
  ],
  [
    "10:42:08.115",
    "info",
    `${GREEN}checkpoint complete: wrote 214 buffers (1.3%)${RESET}`,
  ],
  ["10:42:09.664", "debug", `${DIM}statement duration: 2.481 ms${RESET}`],
];

const pad = (value: number) => String(value).padStart(2, "0");

const entryAt = (index: number) =>
  RAW[index % RAW.length] as readonly [string, LogLine["level"], string];

const displayTime = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(
    date.getMilliseconds()
  ).padStart(3, "0")}`;

const TOTAL = 480;
const STEP_MS = 15_000;
const ORIGIN = Date.now() - TOTAL * STEP_MS;

export const logsViewerLines: LogLine[] = Array.from(
  { length: TOTAL },
  (_, index) => {
    const [, level, message] = entryAt(index);
    const stamp = new Date(ORIGIN + index * STEP_MS);
    return {
      at: stamp.toISOString(),
      id: `log-${index}`,
      level,
      message,
      source: "compute-0",
      timestamp: displayTime(stamp),
    };
  }
);

export const logsViewerStreamLine = (index: number): LogLine => {
  const [, level, message] = entryAt(index);
  const stamp = new Date();
  return {
    at: stamp.toISOString(),
    id: `stream-${index}-${stamp.getTime()}`,
    level,
    message,
    source: "compute-0",
    timestamp: displayTime(stamp),
  };
};
