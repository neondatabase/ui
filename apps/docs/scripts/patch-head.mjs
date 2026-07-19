/**
 * Post-build head polish: injects the meta tags Blume doesn't emit for
 * custom seo.image cards — OG image dimensions and alt, og:locale,
 * theme-color, and the web app manifest link. Runs after `blume build`
 * (see the build script), so crawlers see static tags.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.join(import.meta.dirname, "..", "dist");

const OG_TITLE = /<meta property="og:title" content="(?<title>[^"]*)"/u;

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return walk(full);
      }

      return entry.name.endsWith(".html") ? [full] : [];
    })
  );

  return nested.flat();
};

const tagsFor = (html) => {
  const title = html.match(OG_TITLE)?.groups?.title ?? "Neon UI";
  const tags = [
    ["og:image:width", '<meta property="og:image:width" content="1200"/>'],
    ["og:image:height", '<meta property="og:image:height" content="630"/>'],
    [
      "og:image:alt",
      `<meta property="og:image:alt" content="${title} social card on the Neon aurora"/>`,
    ],
    ["og:locale", '<meta property="og:locale" content="en_US"/>'],
    ["theme-color", '<meta name="theme-color" content="#0c0d0d"/>'],
    ['rel="manifest"', '<link rel="manifest" href="/site.webmanifest"/>'],
  ];

  return tags
    .filter(([marker]) => !html.includes(marker))
    .map(([, tag]) => tag)
    .join("");
};

const files = await walk(distDir);
let patched = 0;

await Promise.all(
  files.map(async (file) => {
    const html = await readFile(file, "utf-8");

    // Only pages with OG metadata get the treatment.
    if (!(html.includes('property="og:image"') && html.includes("</head>"))) {
      return;
    }

    const inject = tagsFor(html);

    if (!inject) {
      return;
    }

    await writeFile(file, html.replace("</head>", `${inject}</head>`), "utf-8");
    patched += 1;
  })
);

console.log(`patched head tags in ${patched} pages`);
