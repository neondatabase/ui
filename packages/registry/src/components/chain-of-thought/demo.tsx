"use client";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "./chain-of-thought";
import { chainOfThoughtSteps } from "./fixtures";

export const ChainOfThoughtDemo = () => (
  <div className="w-full max-w-md">
    <ChainOfThought defaultOpen>
      <ChainOfThoughtHeader />
      <ChainOfThoughtContent>
        {chainOfThoughtSteps.map((step) => (
          <ChainOfThoughtStep
            description={step.description}
            key={step.label}
            label={step.label}
            status={step.status}
          >
            {step.searchResults ? (
              <ChainOfThoughtSearchResults>
                {step.searchResults.map((result) => (
                  <ChainOfThoughtSearchResult
                    key={result.url}
                    render={
                      <a
                        aria-label={result.title}
                        href={result.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      />
                    }
                  >
                    {result.title}
                  </ChainOfThoughtSearchResult>
                ))}
              </ChainOfThoughtSearchResults>
            ) : null}
          </ChainOfThoughtStep>
        ))}
      </ChainOfThoughtContent>
    </ChainOfThought>
  </div>
);

export default ChainOfThoughtDemo;
