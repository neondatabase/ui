/**
 * Composites the docs' social cards: each page's title overlaid on the
 * brand aurora frame (assets/og-blank.png), written to public/og-cards/
 * mirroring the route. The home page ships the fully designed card
 * (assets/og-home-src.png) as /og-home.png.
 *
 * Cards are generated locally and committed, so builds stay deterministic
 * and CI never needs fonts. Re-run after adding a docs page:
 *
 *   node scripts/build-og.mjs
 *
 * Requires the Inter font installed locally (the overlay type).
 */

import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const { dirname, join, relative } = path;

const root = import.meta.dirname;
const docsDir = join(root, "..", "docs");
const outDir = join(root, "..", "public", "og-cards");
const blank = join(root, "..", "assets", "og-blank.png");
const homeSrc = join(root, "..", "assets", "og-home-src.png");

const WIDTH = 2400;
const HEIGHT = 1260;
const OUT_WIDTH = 1200;
const OUT_HEIGHT = 630;
const MARGIN_X = 120;
const TITLE_SIZE = 150;
const TITLE_BASELINE = 260;

const escapeXml = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const titleOverlay = (title) => `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text x="${MARGIN_X}" y="${TITLE_BASELINE}"
    font-family="Inter" font-weight="600" font-size="${TITLE_SIZE}"
    fill="#ffffff" letter-spacing="-2">${escapeXml(title)}</text>
</svg>`;

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  const nested = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        return walk(full);
      }

      return entry.name.endsWith(".mdx") ? [full] : [];
    })
  );

  return [...files, ...nested.flat()];
};

const titleOf = async (file) => {
  const raw = await readFile(file, "utf-8");
  const match = raw.match(/^---\n[\s\S]*?title:\s*(?<title>.+?)\n[\s\S]*?---/u);
  return match?.groups?.title
    ? match.groups.title.trim().replaceAll(/^["']|["']$/gu, "")
    : null;
};

const buildCard = async (title, outFile) => {
  await mkdir(dirname(outFile), { recursive: true });
  // Rasterize the overlay to exact canvas size first — librsvg can
  // round SVG dimensions up, which composite() refuses.
  const overlay = await sharp(Buffer.from(titleOverlay(title)))
    .resize(WIDTH, HEIGHT)
    .png()
    .toBuffer();
  // Two passes: sharp resizes before compositing within one pipeline,
  // so land the overlay at full size first, then downscale.
  const full = await sharp(blank)
    .composite([{ input: overlay, left: 0, top: 0 }])
    .png()
    .toBuffer();
  await sharp(full)
    .resize(OUT_WIDTH, OUT_HEIGHT)
    .png({ compressionLevel: 9 })
    .toFile(outFile);
};

const files = await walk(docsDir);

const results = await Promise.all(
  files.map(async (file) => {
    const rel = relative(docsDir, file).replace(/\.mdx$/u, "");

    if (rel === "index") {
      return 0;
    }

    const title = await titleOf(file);

    if (!title) {
      console.warn(`skip (no title): ${rel}`);
      return 0;
    }

    await buildCard(title, join(outDir, "docs", `${rel}.png`));
    return 1;
  })
);

const count = results.reduce((sum, n) => sum + n, 0);

// The home page ships the designed card untouched (center-crop to 1200×630).
await sharp(homeSrc)
  .resize(OUT_WIDTH, OUT_HEIGHT, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(join(root, "..", "public", "og-home.png"));

console.log(`built ${count} cards + og-home.png`);
