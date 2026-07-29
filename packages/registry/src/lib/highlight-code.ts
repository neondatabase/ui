import { codeToHtml } from "shiki";

const lightTheme = "github-light";
const darkTheme = "github-dark";

/**
 * Highlight code with shiki.
 *
 * When `theme` is omitted, renders dual light/dark output using CSS variables
 * (adapts to the site's color mode automatically).
 *
 * When `theme` is provided, renders single-theme output with inline styles
 * matching the specified shiki theme (e.g. "dracula", "nord", "monokai").
 */
export const highlightCode = (
  code: string,
  language = "tsx",
  theme?: string
): Promise<string> => {
  if (theme) {
    return codeToHtml(code, {
      lang: language,
      theme,
    });
  }

  return codeToHtml(code, {
    defaultColor: false,
    lang: language,
    themes: {
      dark: darkTheme,
      light: lightTheme,
    },
  });
};
