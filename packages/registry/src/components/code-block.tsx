import type * as React from "react";

import type { CodeBlockProps } from "@/components/code-block-view";
import { CodeBlockView } from "@/components/code-block-view";
import { highlightCode } from "@/lib/highlight-code";

export const CodeBlock = async ({
  code,
  language = "tsx",
  theme,
  ...props
}: CodeBlockProps): Promise<React.JSX.Element> => {
  const highlighted = await highlightCode(code, language, theme);

  return (
    <CodeBlockView code={code} language={language} theme={theme} {...props}>
      {/* oxlint-disable-next-line react/no-danger -- Shiki output for `code` */}
      <div dangerouslySetInnerHTML={{ __html: highlighted }} />
    </CodeBlockView>
  );
};
