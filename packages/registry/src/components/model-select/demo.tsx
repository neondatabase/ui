"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

import { defaultModelId, gatewayModels } from "./fixtures";
import { ModelSelect } from "./model-select";

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
  Google: logo("google"),
  Meta: logo("meta"),
  OpenAI: logo("openai"),
};

export const ModelSelectDemo = () => {
  const [model, setModel] = useState(defaultModelId);

  return (
    <ModelSelect
      logos={providerLogos}
      models={gatewayModels}
      onValueChange={setModel}
      value={model}
    />
  );
};

export default ModelSelectDemo;
