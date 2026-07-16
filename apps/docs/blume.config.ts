import { defineConfig } from "blume";

export default defineConfig({
  content: {
    sources: [
      { prefix: "docs", root: "docs", type: "filesystem" },
      // Changelog entries come straight from GitHub Releases.
      // NOTE (transfer day): update this slug when the repo moves to neondatabase/.
      {
        owner: "jal-co",
        prefix: "changelog",
        repo: "neon-ui",
        type: "github-releases",
      },
    ],
  },
  description:
    "The official Neon UI Registry. Production-ready components and blocks for building modern applications on Neon.",
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
  theme: {
    accent: "#00e599",
    background: { dark: "#0c0d0d" },
    fonts: {
      body: "geist",
      display: "geist",
      mono: "geist-mono",
    },
  },
  title: "Neon UI",
});
