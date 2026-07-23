import { defineConfig } from "blume";

export default defineConfig({
  content: {
    sources: [{ root: "docs", type: "filesystem" }],
  },
  // deployment.site stays unset on purpose: Blume derives it from
  // Vercel's env (VERCEL_PROJECT_PRODUCTION_URL) per deployment, so
  // canonicals, OG URLs, and the sitemap always match the serving
  // domain — and flip to ui.neon.com automatically when that becomes
  // the production domain.
  description: "The UI Layer for building applications on Neon.",
  // No "Was this helpful?" widget on docs pages.
  feedback: false,
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
  navigation: {
    // Render every sidebar section as a collapsible `<details>` disclosure so
    // folder meta `collapsed: true` takes effect (e.g. Base Components starts
    // closed). Sections without `collapsed` render open.
    sidebar: { display: "group" },
    // Header links to the docs and the custom /changelog page.
    // Docs points at the root so the sidebar keeps the full tree
    // (a tab path scopes the sidebar to its folder otherwise).
    tabs: [
      { label: "Docs", path: "/" },
      { label: "Changelog", path: "/changelog" },
    ],
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
