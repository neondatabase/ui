"use client";

import { useEffect, useState } from "react";

import { reasoningText } from "./fixtures";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";

const WORDS = reasoningText.split(" ");
const WORDS_PER_TICK = 4;
const TICK_MS = 180;
const RESTART_DELAY_MS = 4000;

/**
 * Simulates a thinking stream on a loop: the panel opens itself while
 * words arrive, then folds to a "Thought for Ns" receipt.
 */
export const ReasoningDemo = () => {
  const [count, setCount] = useState(0);
  const streaming = count < WORDS.length;

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        setCount(streaming ? count + WORDS_PER_TICK : 0);
      },
      streaming ? TICK_MS : RESTART_DELAY_MS
    );
    return () => clearTimeout(timeout);
  }, [count, streaming]);

  return (
    <div className="w-full max-w-md">
      <Reasoning isStreaming={streaming}>
        <ReasoningTrigger />
        <ReasoningContent>{WORDS.slice(0, count).join(" ")}</ReasoningContent>
      </Reasoning>
    </div>
  );
};

export default ReasoningDemo;
