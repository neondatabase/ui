"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { ThinkingEffort } from "../thinking-select/thinking-select";
import { defaultEffort, defaultModelId, gatewayModels } from "./fixtures";
import { ThinkingModelSelect } from "./thinking-model-select";

/**
 * Brand marks from theSVG, applied as alpha masks filled with
 * currentColor so they always match the surrounding text color.
 */
const logo = (slug: string) => {
  const url = `url(https://thesvg.org/icons/${slug}/default.svg)`;
  const style: CSSProperties = {
    WebkitMaskImage: url,
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskImage: url,
    maskPosition: "center",
    maskRepeat: "no-repeat",
    maskSize: "contain",
  };

  return <span className="block bg-current" style={style} />;
};

const providerLogos: Record<string, ReactNode> = {
  Alibaba: logo("alibaba"),
  Anthropic: logo("anthropic"),
  Google: logo("google"),
  Meta: logo("meta"),
  OpenAI: logo("openai"),
};

export const ThinkingModelSelectDemo = () => {
  const [model, setModel] = useState(defaultModelId);
  const [effort, setEffort] = useState<ThinkingEffort>(defaultEffort);

  const shared = {
    effort,
    logos: providerLogos,
    models: gatewayModels,
    onEffortChange: setEffort,
    onValueChange: setModel,
    value: model,
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <ThinkingModelSelect size="lg" {...shared} />
      <ThinkingModelSelect size="md" {...shared} />
      <ThinkingModelSelect size="sm" {...shared} />
    </div>
  );
};

export default ThinkingModelSelectDemo;
