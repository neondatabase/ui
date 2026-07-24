"use client";

import { defaultQuery, result, syntaxError } from "./fixtures";
import { SQLRunner } from "./sql-runner";
import type { SQLExecutionContext } from "./sql-runner";

const wait = (signal: AbortSignal) =>
  // oxlint-disable-next-line promise/avoid-new -- cancellable demo latency needs a timer promise
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 550);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Query cancelled", "AbortError"));
      },
      { once: true }
    );
  });

const execute = async (query: string, context: SQLExecutionContext) => {
  await wait(context.signal);
  if (/\bform\b/iu.test(query)) {
    throw syntaxError;
  }
  if (/^\s*(?:update|insert|delete)/iu.test(query)) {
    const [command] = query.trim().split(/\s+/u);
    return {
      command: command?.toUpperCase(),
      rowCount: 1,
      rows: [],
    };
  }
  return result;
};

export const SQLRunnerDemo = () => (
  <SQLRunner
    className="w-full max-w-2xl"
    database="production / neondb"
    defaultValue={defaultQuery}
    onExecute={execute}
  />
);

export default SQLRunnerDemo;
