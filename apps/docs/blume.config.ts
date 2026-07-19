import { defineConfig } from "blume";

export default defineConfig({
  content: {
    sources: [{ prefix: "docs", root: "docs", type: "filesystem" }],
  },
  // NOTE (transfer day): ui.neon.com goes live with the repo move;
  // canonicals, OG URLs, feeds, and the sitemap all key off this.
  deployment: {
    site: "https://ui.neon.com",
  },
  description: "The UI Layer for building applications on Neon.",
  // Component previews read straight from the registry demos, so the Preview
  // tab renders the exact source the Code tab shows. theme.css injects the Neon
  // design tokens into the isolated preview frame.
  examples: {
    css: "examples/theme.css",
    source: "../../packages/registry/src/components/**/demo.tsx",
  },
  // Header repository link, edit-on-GitHub, and feedback actions.
  github: {
    owner: "neonpostgres",
    repo: "ui",
  },
  logo: {
    // Full "NEON UI" lockup. Filenames are keyed by ink color, so they map
    // inverted to Blume's theme keys: light-ink art shows in dark mode,
    // dark-ink art shows in light mode.
    image: {
      alt: "Neon UI",
      dark: "/brand/neon-logo-color-light.svg",
      light: "/brand/neon-logo-color-dark.svg",
    },
    text: "",
  },
  seo: {
    // Generated cards for every page, branded to the house; the home
    // page overrides with the designed card via seo.image frontmatter.
    og: {
      enabled: true,
      logo: "/favicon.svg",
      palette: {
        accent: "#00e599",
        background: "#0c0d0d",
        foreground: "#ffffff",
        muted: "#a1a5a3",
      },
    },
    robots: true,
    rss: { enabled: false },
    sitemap: true,
    structuredData: true,
    x: { handle: "@neondatabase" },
  },
  theme: {
    accent: "#00e599",
    background: { dark: "#0c0d0d" },
    fonts: {
      body: "inter",
      display: "inter",
      mono: "geist-mono",
    },
    mode: "dark",
    radius: "none",
  },
  title: "Neon UI",
});
