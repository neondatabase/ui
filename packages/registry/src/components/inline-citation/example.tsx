import type { Citation } from "./fixtures";
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

/**
 * Render model output with `[n]` citation markers, e.g. the streamed
 * result of a structured-output route (`experimental_useObject` with a
 * `{ content, citations }` schema). Markers with a matching source
 * become hoverable pills; everything else renders as prose.
 */
export const InlineCitationExample = ({
  citations,
  content,
}: {
  /** Model text containing `[1]`-style markers. */
  content: string;
  /** Sources the markers refer to. */
  citations: Citation[];
}) => (
  <p className="text-sm leading-relaxed">
    {content.split(MARKER).map((part, index) => {
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
