"use client";

import { citations, citedContent } from "./fixtures";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationQuote,
  InlineCitationSource,
  InlineCitationText,
} from "./inline-citation";

const MARKER = /(?<marker>\[\d+\])/u;
const MARKER_NUMBER = /\[(?<number>\d+)\]/u;

export const InlineCitationDemo = () => (
  <p className="max-w-md text-sm leading-relaxed">
    {citedContent.split(MARKER).map((part, index) => {
      const number = MARKER_NUMBER.exec(part)?.groups?.number;
      const citation = citations.find((entry) => entry.number === number);

      if (!citation) {
        return (
          <InlineCitation key={`${part.slice(0, 16)}-${index.toString()}`}>
            <InlineCitationText>{part}</InlineCitationText>
          </InlineCitation>
        );
      }

      return (
        <InlineCitationCard key={citation.number}>
          <InlineCitationCardTrigger sources={[citation.url]} />
          <InlineCitationCardBody>
            <InlineCitationSource
              description={citation.description}
              title={citation.title}
              url={citation.url}
            />
            {citation.quote ? (
              <InlineCitationQuote>{citation.quote}</InlineCitationQuote>
            ) : null}
          </InlineCitationCardBody>
        </InlineCitationCard>
      );
    })}
  </p>
);

export default InlineCitationDemo;
